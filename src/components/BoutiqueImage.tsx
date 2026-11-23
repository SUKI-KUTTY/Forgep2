import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface BoutiqueImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function BoutiqueImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: BoutiqueImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F2ECE1] via-[#FAF7F2] to-[#E8DEC9] text-[#6B1D2F] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 text-[#C59B27] mb-2" aria-hidden="true" />
        <span className="font-serif text-sm font-medium text-[#1E1B18] line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
