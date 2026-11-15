import React from "react";
import { Link } from "react-router-dom";
import { useBeta } from "@/context/BetaContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Tv, Lightbulb, Crown, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export const BetaSettingsCard: React.FC = () => {
  const { isBetaEnabled, isRegistered, setBetaEnabled } = useBeta();

  if (!isRegistered) {
    return (
      <Card className="w-full border-pink-500/20 bg-gradient-to-br from-card via-card to-pink-950/10 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <span>ReverseX Labs · Бета-режим</span>
            </CardTitle>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Beta
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Экспериментальные функции сайта (Watch, Рекомендации, Тир-листы) скрыты от обычных зрителей.
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">Требуется авторизация</div>
                <div className="text-xs text-muted-foreground">
                  Войдите в аккаунт, чтобы включить бета-тестирование и получить доступ к скрытым разделам.
                </div>
              </div>
            </div>
            <Button asChild size="sm" className="bg-pink-500 hover:bg-pink-600 text-white shrink-0">
              <Link to="/auth">Войти в аккаунт</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-pink-500/25 bg-gradient-to-br from-card via-card to-pink-950/15 shadow-xl relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
            <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.25)]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span>ReverseX Labs · Бета-режим</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Beta
              </span>
            </div>
          </CardTitle>

          {/* Toggle button */}
          <button
            onClick={() => setBetaEnabled(!isBetaEnabled)}
            role="switch"
            aria-checked={isBetaEnabled}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${
              isBetaEnabled ? "bg-gradient-to-r from-pink-500 to-rose-600 shadow-[0_0_16px_rgba(236,72,153,0.5)]" : "bg-muted border border-border"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
                isBetaEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isBetaEnabled
            ? "Бета-режим активен. Экспериментальные разделы добавлены в верхнюю панель навигации сайта."
            : "Экспериментальные функции скрыты от обычных зрителей. Включите бета-режим, чтобы протестировать новые разделы."}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {isBetaEnabled ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-pink-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Доступные экспериментальные разделы:
            </div>

            {/* Feature 1: Watch */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-pink-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">ReverseX Watch</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded text-zinc-300">/ws</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Каталог Топ-40 сериалов с экспериментальными плеерами и озвучками.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-pink-500/30 text-pink-300 hover:bg-pink-500/15 shrink-0">
                <Link to="/ws" className="flex items-center gap-1.5">
                  Открыть Watch
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            {/* Feature 2: Recs */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-pink-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Рекомендации (Recs)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded text-zinc-300">/recommendations</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Умные подборки фильмов и сериалов на основе персональных вкусов.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/15 shrink-0">
                <Link to="/recommendations" className="flex items-center gap-1.5">
                  Открыть Recs
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            {/* Feature 3: Tier Lists */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-pink-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Тир-листы (Tier Lists)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 rounded text-zinc-300">/tier-lists</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Интерактивный конструктор уровней для ранжирования любимого контента.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/15 shrink-0">
                <Link to="/tier-lists" className="flex items-center gap-1.5">
                  Открыть Тир-листы
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-white/15 bg-black/20 text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              Разделы <span className="text-foreground font-semibold">Watch</span>, <span className="text-foreground font-semibold">Рекомендации</span> и <span className="text-foreground font-semibold">Тир-листы</span> скрыты. Навигация сайта работает в чистом основном режиме.
            </p>
            <Button
              onClick={() => setBetaEnabled(true)}
              size="sm"
              className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40"
            >
              Включить Бета-тестирование
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BetaSettingsCard;
