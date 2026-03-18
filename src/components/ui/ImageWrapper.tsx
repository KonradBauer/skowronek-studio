import Image, { type ImageProps } from 'next/image'

interface ImageWrapperProps extends Omit<ImageProps, 'alt'> {
  alt: string
  aspectRatio?: string
  className?: string
  containerClassName?: string
}

export function ImageWrapper({
  alt,
  aspectRatio,
  className = '',
  containerClassName = '',
  ...props
}: ImageWrapperProps) {
  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <Image
        alt={alt}
        className={`object-cover ${className}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}
