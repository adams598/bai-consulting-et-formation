import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  publicId?: string;
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number | string;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  lazy?: boolean;
  placeholder?: string;
}

interface OptimizedVideoProps {
  publicId?: string;
  src?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
  lazy?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  playsInline?: boolean;
  quality?: number | string;
}

// Configuration Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

// Fonction utilitaire pour construire les URLs Cloudinary
const buildCloudinaryUrl = (
  publicId: string, 
  type: 'image' | 'video', 
  options: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
  } = {}
) => {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  let transformations = `f_${format},q_${quality}`;
  
  if (width) {
    transformations += `,w_${width}`;
  }
  
  if (height) {
    transformations += `,h_${height}`;
  }
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${type}/upload/${transformations}/v1/${publicId}`;
};

// Composant pour les images optimisées avec lazy loading
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  publicId,
  src,
  alt,
  className = '',
  width,
  height,
  quality = 'auto',
  format = 'auto',
  lazy = true,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+'
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!publicId && !src) return;

    const imageUrl = publicId 
      ? buildCloudinaryUrl(publicId, 'image', { width, height, quality, format })
      : src;

    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(imageUrl);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setError(true);
        setIsLoaded(true);
      };
      img.src = imageUrl;
    }
  }, [publicId, src, width, height, quality, format]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      width={width}
      height={height}
      loading={lazy ? "lazy" : "eager"}
      onError={() => setError(true)}
      style={{
        backgroundColor: error ? '#f3f4f6' : 'transparent',
      }}
    />
  );
};

// Composant pour les vidéos optimisées avec lazy loading
export const OptimizedVideo: React.FC<OptimizedVideoProps> = ({
  publicId,
  src,
  className = '',
  autoPlay = false,
  loop = false,
  muted = true,
  controls = false,
  poster,
  lazy = true,
  preload = 'metadata',
  playsInline = true
}) => {
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!publicId && !src) return;

    const videoUrl = publicId 
      ? buildCloudinaryUrl(publicId, 'video', { quality: 'auto', format: 'auto' })
      : src;

    if (videoUrl) {
      setVideoSrc(videoUrl);
      setIsLoaded(true);
    }
  }, [publicId, src]);

  if (!isLoaded && lazy) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <div className="text-gray-500">Chargement de la vidéo...</div>
      </div>
    );
  }

  return (
    <video
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      controls={controls}
      playsInline={playsInline}
      poster={poster}
      preload={preload}
    >
      <source src={videoSrc} type="video/mp4" />
      Votre navigateur ne supporte pas la vidéo.
    </video>
  );
};

// Hook pour utiliser les médias Cloudinary
export const useCloudinaryMedia = () => {
  const getImageUrl = (publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
  }) => {
    return buildCloudinaryUrl(publicId, 'image', options);
  };

  const getVideoUrl = (publicId: string, options?: {
    quality?: number | string;
    format?: string;
  }) => {
    return buildCloudinaryUrl(publicId, 'video', options);
  };

  return {
    getImageUrl,
    getVideoUrl
  };
};

// Mapping des médias existants (à remplacer par vos URLs Cloudinary)
export const MEDIA_MAPPING = {
  // Images
  'assurance.webp': 'bai-consulting/images/assurance',
  'banque.webp': 'bai-consulting/images/banque',
  'immobilier.webp': 'bai-consulting/images/immobilier',
  'presentation.png': 'bai-consulting/images/presentation',
  'family-7257182_1280.jpg': 'bai-consulting/images/family-7257182_1280',
  'concept-de-banniere-de-collegues-de-travail-avec-espace-de-copie.jpg': 'bai-consulting/images/concept-de-banniere-de-collegues-de-travail-avec-espace-de-copie',
  
  // Vidéos
  'assurance.mp4': 'bai-consulting/videos/assurance',
  'banque.mp4': 'bai-consulting/videos/banque',
  'immo.mp4': 'bai-consulting/videos/immo',
  'solutions.mp4': 'bai-consulting/videos/solutions'
} as const;

// Composant de migration pour faciliter la transition
export const CloudinaryMedia: React.FC<{
  src: string;
  alt?: string;
  type: 'image' | 'video';
  className?: string;
  lazy?: boolean;
  [key: string]: any;
}> = ({ src, alt, type, className, lazy = true, ...props }) => {
  // Si c'est déjà une URL Cloudinary, l'utiliser directement
  if (src.startsWith('https://res.cloudinary.com/')) {
    if (type === 'image') {
      return <OptimizedImage src={src} alt={alt || ''} className={className} lazy={lazy} {...props} />;
    } else {
      return <OptimizedVideo src={src} className={className} lazy={lazy} {...props} />;
    }
  }

  // Sinon, essayer de mapper avec les médias existants
  const fileName = src.split('/').pop();
  const publicId = fileName ? MEDIA_MAPPING[fileName as keyof typeof MEDIA_MAPPING] : null;

  if (publicId) {
    if (type === 'image') {
      return (
        <OptimizedImage
          publicId={publicId}
          alt={alt || ''}
          className={className}
          lazy={lazy}
          {...props}
        />
      );
    } else {
      return (
        <OptimizedVideo
          publicId={publicId}
          className={className}
          lazy={lazy}
          {...props}
        />
      );
    }
  }

  // Fallback vers l'URL originale
  if (type === 'image') {
    return <OptimizedImage src={src} alt={alt || ''} className={className} lazy={lazy} {...props} />;
  } else {
    return <OptimizedVideo src={src} className={className} lazy={lazy} {...props} />;
  }
}; 