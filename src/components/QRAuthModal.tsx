import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface QRAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Phase =
  | 'creating'
  | 'waiting'
  | 'redeeming'
  | 'expired'
  | 'error';

const POLL_MS = 2500;

const deviceLabel = (): string => {
  const ua = navigator.userAgent;
  const browser = ua.includes('Edg/') ? 'Edge'
    : ua.includes('Chrome/') ? 'Chrome'
    : ua.includes('Safari/') && ua.includes('Version/') ? 'Safari'
    : ua.includes('Firefox/') ? 'Firefox'
    : 'Браузер';
  const os = ua.includes('Windows') ? 'Windows'
    : ua.includes('Mac OS') ? 'macOS'
    : ua.includes('Android') ? 'Android'
    : ua.includes('Linux') ? 'Linux'
    : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
    : 'Устройство';
  return `${browser} · ${os}`;
};

const QRAuthModal = ({ open, onClose, onSuccess }: QRAuthModalProps) => {
  const [phase, setPhase] = useState<Phase>('creating');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [errorText, setErrorText] = useState('');
  const busyRef = useRef(false);
  const sessionRef = useRef<string | null>(null);

  const qrValue = sessionId ? `${window.location.origin}/qr-auth?session=${sessionId}` : '';

  const cleanupSession = useCallback(async (id: string | null, status: 'consumed' | 'cancelled') => {
    if (!id) return;
    try {
      await supabase.from('qr_login_sessions').update({ status }).eq('id', id);
      await supabase.from('qr_login_sessions').delete().eq('id', id);
    } catch {
      /* best effort */
    }
  }, []);

  const createSession = useCallback(async () => {
    busyRef.current = false;
    setPhase('creating');
    setQrImg(null);
    setErrorText('');
    try {
      const { data, error } = await supabase
        .from('qr_login_sessions')
        .insert({ device_label: deviceLabel() })
        .select('id, expires_at')
        .single();
      if (error || !data) throw error || new Error('no session');

      sessionRef.current = data.id;
      setSessionId(data.id);
      setExpiresAt(new Date(data.expires_at).getTime());

      // QR в <img> через dataURL — надёжнее canvas в модалке (чинился белый квадрат)
      const url = `${window.location.origin}/qr-auth?session=${data.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
      });
      setQrImg(dataUrl);
      setPhase('waiting');
    } catch (e) {
      console.error('QR session create failed:', e);
      setErrorText('Не удалось создать QR-сессию. Проверьте соединение.');
      setPhase('error');
    }
  }, []);

  // Создание сессии при открытии
  useEffect(() => {
    if (open) {
      sessionRef.current = null;
      setSessionId(null);
      createSession();
    } else {
      setPhase('creating');
      setQrImg(null);
      setSessionId(null);
    }
  }, [open, createSession]);

  // Тикающий таймер для обратного отсчёта
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open ]);

  const redeem = useCallback(async (tokenHash: string, id: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPhase('redeeming');
    try {
      const { error } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: tokenHash,
      });
      if (error) throw error;
      await cleanupSession(id, 'consumed');
      toast.success('Вы вошли!');
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('QR redeem failed:', e);
      setErrorText('Вход не удался: код уже использован или истёк. Создайте новый QR.');
      setPhase('error');
    } finally {
      busyRef.current = false;
    }
  }, [cleanupSession, onClose, onSuccess]);

  // Realtime + опрос статуса сессии
  useEffect(() => {
    if (!open || !sessionId || phase !== 'waiting') return;

    const check = async () => {
      const { data } = await supabase
        .from('qr_login_sessions')
        .select('status, expires_at, login_token_hash')
        .eq('id', sessionId)
        .single();
      if (!data) return;
      if (new Date(data.expires_at).getTime() < Date.now() || data.status === 'expired') {
        setPhase('expired');
        return;
      }
      if (data.status === 'approved' && data.login_token_hash) {
        redeem(data.login_token_hash, sessionId);
      } else if (data.status === 'cancelled' || data.status === 'consumed') {
        setPhase('expired');
      }
    };

    const channel = supabase
      .channel(`qr_${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'qr_login_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as { status: string; login_token_hash: string | null; expires_at: string };
          if (row.status === 'approved' && row.login_token_hash) {
            redeem(row.login_token_hash, sessionId);
          } else if (row.status !== 'pending') {
            setPhase('expired');
          }
        }
      )
      .subscribe();

    const poll = setInterval(check, POLL_MS);
    check();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [open, sessionId, phase, redeem]);

  // Просрочка по клиентскому таймеру
  useEffect(() => {
    if (phase === 'waiting' && expiresAt && now > expiresAt) {
      setPhase('expired');
      cleanupSession(sessionRef.current, 'cancelled');
    }
  }, [now, phase, expiresAt, cleanupSession]);

  const handleClose = () => {
    cleanupSession(sessionRef.current, 'cancelled');
    onClose();
  };

  const copyLink = () => {
    if (!qrValue) return;
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Ссылка скопирована!');
  };

  const secsLeft = Math.max(0, Math.round((expiresAt - now) / 1000));
  const mmss = `${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сканируй QR-код</DialogTitle>
          <DialogDescription>
            Отсканируйте код камерой телефона, где вы уже вошли — вход подтвердится автоматически
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">
          {(phase === 'creating' || phase === 'redeeming') && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {phase === 'creating' ? 'Создаём защищённую сессию...' : 'Входим...'}
              </p>
            </div>
          )}

          {phase === 'waiting' && (
            <>
              <div className="bg-white p-4 rounded-xl">
                {qrImg ? (
                  <img src={qrImg} alt="QR для входа" width={224} height={224} />
                ) : (
                  <div className="w-56 h-56 animate-pulse bg-zinc-200 rounded" />
                )}
              </div>

              <div className="w-full">
                <p className="text-sm text-muted-foreground mb-2">Или откройте ссылку на телефоне:</p>
                <Button variant="outline" className="w-full justify-between" onClick={copyLink}>
                  <span className="text-xs truncate">{qrValue}</span>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ожидание подтверждения... {mmss}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Одноразовый код, действует 3 минуты
                </p>
              </div>
            </>
          )}

          {(phase === 'expired' || phase === 'error') && (
            <div className="text-center py-4 w-full">
              <p className="text-sm text-muted-foreground mb-4">
                {phase === 'expired' ? 'Код истёк — создайте новый.' : errorText}
              </p>
              <Button onClick={createSession} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Новый QR-код
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRAuthModal;
