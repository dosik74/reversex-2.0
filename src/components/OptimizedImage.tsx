import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  fallback,
  className = "",
  width,
  height,
  priority = false,
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(
    priority ? src : null
  );
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (priority) return;

    // Use Intersection Observer for lazy loading
    const img = document.getElementById(`img-${src}`) as HTMLImageElement;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "50px" }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [src, priority]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setError(true);
    setIsLoading(false);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  // Generate WebP URL if available
  const generateWebpUrl = (originalUrl: string): string => {
    // For TMDB URLs, we can try to use webp format
    if (originalUrl.includes("image.tmdb.org")) {
      // TMDB supports webp through URL parameter
      return originalUrl.replace(/\/t\/p\//, "/t/p/");
    }
    return originalUrl;
  };

  const displaySrc = error ? fallback : imageSrc;
  const webpSrc = displaySrc ? generateWebpUrl(displaySrc) : null;

  return (
    <picture className={`block overflow-hidden ${className}`}>
      {webpSrc && !error && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      <img
        id={`img-${src}`}
        src={displaySrc || fallback}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-opacity ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
        style={{
          aspectRatio: width && height ? `${width}/${height}` : "auto",
        }}
      />
    </picture>
  );
};

export default OptimizedImage;
