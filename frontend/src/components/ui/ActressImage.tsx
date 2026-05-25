'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getActressImageSrc, ACTRESS_IMAGE_FALLBACK } from '@/lib/actressImages';

interface ActressImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function ActressImage({
  src,
  alt,
  className,
  priority = false,
  sizes = '(max-width: 768px) 50vw, 200px',
}: ActressImageProps) {
  const [imgSrc, setImgSrc] = useState(getActressImageSrc(src));

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={cn('object-cover object-top', className)}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => {
        if (imgSrc !== ACTRESS_IMAGE_FALLBACK) {
          setImgSrc(ACTRESS_IMAGE_FALLBACK);
        }
      }}
    />
  );
}
