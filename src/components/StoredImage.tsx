import React, { useState, useEffect } from 'react'

interface StoredImageProps {
  src: string
  alt: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export function StoredImage({ src, alt, className, onLoad, onError }: StoredImageProps) {
  const [imageData, setImageData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        
        // If it's already a data URL (base64), use it directly
        if (src.startsWith('data:')) {
          setImageData(src)
          setIsLoading(false)
          onLoad?.()
          return
        }
        
        // If it's a stored image path, fetch from KV storage
        if (src.startsWith('/images/')) {
          const storedData = await spark.kv.get<string>(src)
          if (storedData) {
            setImageData(storedData)
            onLoad?.()
          } else {
            setHasError(true)
            onError?.()
          }
        } else {
          // Regular URL, use as is
          setImageData(src)
          onLoad?.()
        }
      } catch (error) {
        console.error('Error loading image:', error)
        setHasError(true)
        onError?.()
      } finally {
        setIsLoading(false)
      }
    }

    loadImage()
  }, [src, onLoad, onError])

  if (isLoading) {
    return (
      <div className={`bg-muted animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    )
  }

  if (hasError || !imageData) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground text-sm">Image non disponible</div>
      </div>
    )
  }

  return (
    <img
      src={imageData}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
    />
  )
}