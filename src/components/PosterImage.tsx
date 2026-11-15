import { useState } from "react";
import { Film } from "lucide-react";

interface PosterImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/**
 * Высокопроизводительный компонент постера с плавным cross-fade,
 * элегантным shimmer-скелетоном и защитой от показа сырого alt-текста при загрузке.
 */
export default function PosterImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  loading = "lazy",
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isValidSrc = !!src && !hasError;

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      {/* 1. Элегантный темный шиммер-скелетон (пока картинка скачивается) */}
      {!loaded && isValidSrc && (
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800/60 to-zinc-900 animate-pulse flex items-center justify-center">
          <Film className="w-8 h-8 text-white/10" />
        </div>
      )}

      {/* 2. Само изображение с плавным проявлением */}
      {isValidSrc ? (
        <img
          src={src}
          alt=""
          aria-label={alt}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-500 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        /* 3. Фирменная тёмная заглушка без уродливых внешних ссылок и надписей «No Image» */
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-3 text-center border border-white/5">
          <Film className="w-8 h-8 text-white/20 mb-2" />
          <span className="text-[11px] font-medium text-white/40 line-clamp-2 px-1">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}
