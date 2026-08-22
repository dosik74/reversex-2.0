import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QRAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

const QRAuthModal = ({ open, onClose, onSuccess }: QRAuthModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionId] = useState(() => {
    // Generate unique session ID
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });
  const [copied, setCopied] = useState(false);

  // Generate QR code on mount
  useEffect(() => {
    if (open && canvasRef.current) {
      const qrValue = `${window.location.origin}/qr-auth?session=${sessionId}`;
      QRCode.toCanvas(canvasRef.current, qrValue, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 256
      }).catch(err => console.error('QR code generation error:', err));
    }
  }, [open, sessionId]);

  // Poll for authentication
  useEffect(() => {
    if (!open) return;

    const checkAuth = setInterval(() => {
      const storedData = localStorage.getItem(`qr_auth_${sessionId}`);
      if (storedData) {
        try {
          const { token, userId } = JSON.parse(storedData);
          localStorage.removeItem(`qr_auth_${sessionId}`);
          onSuccess(token);
          clearInterval(checkAuth);
          onClose();
          toast.success('Authenticated successfully!');
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
    }, 500);

    return () => clearInterval(checkAuth);
  }, [open, sessionId, onSuccess, onClose]);

  const qrValue = `${window.location.origin}/qr-auth?session=${sessionId}`;

  const copySessionId = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сканируй QR-код</DialogTitle>
          <DialogDescription>
            Отсканируй QR-код телефоном чтобы выбрать аккаунт и войти
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg">
            <canvas ref={canvasRef} />
          </div>

          {/* Alternative link */}
          <div className="w-full">
            <p className="text-sm text-muted-foreground mb-2">Или откройте ссылку:</p>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={copySessionId}
            >
              <span className="text-xs truncate">{qrValue}</span>
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Loading state */}
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Ожидание подтверждения...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRAuthModal;
