import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  /** Куда вести, если в истории нет предыдущей страницы (прямая ссылка) */
  fallback?: string;
  label?: string;
  className?: string;
}

/**
 * Кнопка «Назад»: возвращается на предыдущую страницу истории,
 * а не на захардкоженный роут. Если истории нет — ведёт на fallback.
 */
export default function BackButton({ fallback = '/', label = 'Назад', className }: BackButtonProps) {
  const navigate = useNavigate();

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={goBack} className={className}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
