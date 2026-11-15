import { useEffect, useState } from "react";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

type Factor = {
  id: string;
  friendly_name?: string | null;
  status: string;
  created_at?: string;
};

/**
 * Двухфакторная аутентификация (TOTP-коды, Google Authenticator и т.п.).
 * Полностью опциональна: по умолчанию выключена, включается здесь.
 */
const TwoFactorSettings = () => {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояние подключения нового фактора
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [busy, setBusy] = useState(false);

  const loadFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors((data?.totp as Factor[]) || []);
    } catch (e: any) {
      console.error('MFA listFactors error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const resetEnroll = () => {
    setEnrolling(false);
    setFactorId(null);
    setChallengeId(null);
    setQrSvg(null);
    setSecret(null);
    setVerifyCode('');
  };

  const startEnroll = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Основное устройство',
      });
      if (error) throw error;

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });
      if (challengeError) throw challengeError;

      setFactorId(data.id);
      setChallengeId(challenge.id);
      setQrSvg(data.totp?.qr_code || null);
      setSecret(data.totp?.secret || null);
      setEnrolling(true);
    } catch (e: any) {
      toast.error(e.message || 'Не удалось начать подключение 2FA');
    } finally {
      setBusy(false);
    }
  };

  const verifyEnroll = async () => {
    const code = verifyCode.replace(/\D/g, '');
    if (!factorId || !challengeId || code.length !== 6) return;
    try {
      setBusy(true);
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) throw error;
      toast.success('Двухфакторная защита включена!');
      resetEnroll();
      loadFactors();
    } catch (e: any) {
      toast.error('Неверный код. Попробуйте ещё раз.');
      setVerifyCode('');
    } finally {
      setBusy(false);
    }
  };

  const unenroll = async (id: string) => {
    try {
      setBusy(true);
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      toast.success('Двухфакторная защита отключена');
      loadFactors();
    } catch (e: any) {
      toast.error(e.message || 'Не удалось отключить 2FA');
    } finally {
      setBusy(false);
    }
  };

  const enabled = factors.some((f) => f.status === 'verified');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? (
            <ShieldCheck className="w-5 h-5 text-green-500" />
          ) : (
            <ShieldOff className="w-5 h-5 text-muted-foreground" />
          )}
          Двухфакторная защита (2FA)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {enabled
            ? 'Включена: при входе нужен дополнительный код из приложения.'
            : 'Выключена. Подключите приложение-аутентификатор (Google Authenticator, Authy и т.п.), чтобы вход требовал код с телефона.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
          </div>
        ) : enrolling && qrSvg ? (
          <div className="space-y-4">
            <div className="text-sm">Отсканируйте QR-код в приложении-аутентификаторе:</div>
            <div className="p-3 bg-white rounded-xl w-fit mx-auto">
              <img src={qrSvg} alt="QR-код 2FA" className="w-48 h-48" />
            </div>
            {secret && (
              <div className="text-xs text-muted-foreground break-all">
                Если QR не сканируется, введите ключ вручную:{' '}
                <span className="font-mono">{secret}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-verify-code">Введите 6-значный код из приложения</Label>
              <Input
                id="mfa-verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verifyEnroll();
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={verifyEnroll} disabled={busy || verifyCode.length !== 6}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Подтвердить и включить'}
              </Button>
              <Button variant="outline" onClick={resetEnroll} disabled={busy}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <>
            {factors.length > 0 && (
              <div className="space-y-2">
                {factors.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {f.friendly_name || 'Аутентификатор'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.status === 'verified' ? 'Активен' : 'Не подтверждён'}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => unenroll(f.id)} disabled={busy}>
                      Отключить
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={startEnroll} disabled={busy}>
              {enabled ? 'Добавить ещё одно устройство' : 'Включить 2FA'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSettings;
