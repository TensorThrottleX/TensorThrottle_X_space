import { useState, useEffect } from 'react';

export type ImageOrientation = 'landscape' | 'portrait' | 'square' | null;

export function useImageOrientation(src: string | undefined | null) {
  const [orientation, setOrientation] = useState<ImageOrientation>(null);

  useEffect(() => {
    if (!src) {
      setOrientation(null);
      return;
    }

    const img = new window.Image();
    
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      
      if (naturalWidth > naturalHeight) {
        setOrientation('landscape');
      } else if (naturalHeight > naturalWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('square');
      }
    };

    img.onerror = () => {
      // Fallback if image fails to load
      setOrientation(null);
    };

    img.src = src;
  }, [src]);

  return orientation;
}
