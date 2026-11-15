import React from "react";
import { Link } from "react-router-dom";
import { useBeta } from "@/context/BetaContext";
import { FlaskConical, ShieldAlert, ArrowRight, Home, Settings as SettingsIcon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BetaRouteGuardProps {
  children?: React.ReactNode;
  featureName?: string;
}

export const BetaRouteGuard: React.FC<BetaRouteGuardProps> = ({
  children,
  featureName = "Этот раздел",
}) => {
  const { isBetaEnabled, isRegistered } = useBeta();

  if (isBetaEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl p-6 sm:p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(236,72,153,0.1)]">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pink-500/15 border border-pink-500/30 text-pink-400 mb-6">
          <FlaskConical className="w-3.5 h-3.5" />
          ReverseX Labs · Закрытый Бета-тест
        </div>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center text-pink-400 shadow-inner">
          <FlaskConical className="w-8 h-8" />
        </div>

        {/* Headings */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          {featureName} в режиме бета-теста
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {isRegistered ? (
            <>
              Этот раздел находится в стадии активной разработки и скрыт от основных зрителей. Чтобы получить доступ, активируйте <span className="text-pink-400 font-semibold">«Бета-режим»</span> в настройках вашего профиля.
            </>
          ) : (
            <>
              Экспериментальные разделы (Watch, Рекомендации, Тир-листы) доступны исключительно зарегистрированным пользователям, активировавшим бета-тестирование в настройках.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
          {isRegistered ? (
            <Button
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-lg shadow-pink-500/20"
            >
              <Link to="/settings" className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Включить в Настройках
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-lg shadow-pink-500/20"
            >
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Войти в аккаунт
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              На главную
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BetaRouteGuard;
