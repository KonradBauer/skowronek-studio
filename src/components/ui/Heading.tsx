import type { ReactNode } from 'react'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

interface HeadingProps {
  as?: HeadingLevel
  children: ReactNode
  className?: string
}

const levelClasses: Record<HeadingLevel, string> = {
  h1: 'text-4xl md:text-5xl lg:text-6xl',
  h2: 'text-3xl md:text-4xl lg:text-5xl',
  h3: 'text-2xl md:text-3xl',
  h4: 'text-xl md:text-2xl',
}

export function Heading({ as: Tag = 'h2', children, className = '' }: HeadingProps) {
  return (
    <Tag className={`font-light tracking-tight text-dark ${levelClasses[Tag]} ${className}`}>
      {children}
    </Tag>
  )
}
