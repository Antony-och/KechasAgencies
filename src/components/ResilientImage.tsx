import { useEffect, useState } from 'react';
import { CarFront } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export default function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EFF3F9] to-[#DCE5F2] text-[#194793] p-6 text-center"
      >
        <CarFront className="w-9 h-9 opacity-75 mb-2" strokeWidth={1.5} />
        <span className="font-serif text-sm font-medium text-[#111827]">
          {fallbackLabel || alt}
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
      loading="lazy"
    />
  );
}
