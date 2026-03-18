import type { ReactNode } from 'react'
import { Container } from './Container'

interface SectionProps {
  children: ReactNode
  id?: string
  className?: string
  alternate?: boolean
}

export function Section({ children, id, className = '', alternate = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-section-sm md:py-section ${alternate ? 'bg-cream' : 'bg-white'} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  )
}
