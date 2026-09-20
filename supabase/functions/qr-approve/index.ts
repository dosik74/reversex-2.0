// Edge Function: qr-approve
// Телефон (залогинен) подтверждает QR-вход десктопа.
// Выпускает ОДНОРАЗОВЫЙ magiclink для email пользователя через Admin API
// и кладёт его hash в строку сессии. Никаких токенов пользователя
// в базе не хранится, телефон остаётся залогинен (ротации refresh-токена нет).
//
// Deploy:
//   supabase functions deploy qr-approve
//   supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=...
//   (JWT verify остаётся включённым — плюс внутренняя проверка getUser)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 1. Кто подтверждает? Только залогиненный пользователь.
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!jwt) {
      return json({ error: 'Not authenticated' }, 401);
    }
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const {
      data: { user },
      error: userErr,
    } = await authed.auth.getUser();
    if (userErr || !user?.email) {
      return json({ error: 'Not authenticated' }, 401);
    }

    // 2. Какая сессия?
    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== 'string') {
      return json({ error: 'session_id required' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: session, error: sessErr } = await admin
      .from('qr_login_sessions')
      .select('id, status, expires_at')
      .eq('id', session_id)
      .single();

    if (sessErr || !session) {
      return json({ error: 'Session not found' }, 404);
    }
    if (session.status !== 'pending') {
      return json({ error: 'Session already used' }, 410);
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
      await admin.from('qr_login_sessions').update({ status: 'expired' }).eq('id', session_id);
      return json({ error: 'Session expired' }, 410);
    }

    // 3. Одноразовый magiclink для email подтверждающего.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('generateLink failed', linkErr);
      return json({ error: 'Could not issue login ticket' }, 500);
    }

    // 4. Атомарно помечаем approved (только если всё ещё pending — защита от двойного approve).
    const { data: updated, error: updErr } = await admin
      .from('qr_login_sessions')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        login_token_hash: linkData.properties.hashed_token as string,
      })
      .eq('id', session_id)
      .eq('status', 'pending')
      .select('id');

    if (updErr || !updated || updated.length === 0) {
      return json({ error: 'Session already used' }, 410);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('qr-approve error', e);
    return json({ error: 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
