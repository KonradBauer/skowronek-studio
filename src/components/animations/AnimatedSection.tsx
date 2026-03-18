'use client'

import { type ReactNode, useRef } from 'react'
import { type Variants, motion, useInView } from 'framer-motion'

type AnimationVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in'

interface AnimatedSectionProps {
  children: ReactNode
  variant?: AnimationVariant
  delay?: number
  className?: string
}

const variants: Record<AnimationVariant, Variants> = {
  'fade-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-left': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  'fade-right': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  'scale-in': {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
}

export function AnimatedSection({
  children,
  variant = 'fade-up',
  delay = 0,
  className = '',
}: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[variant]}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.76, 0, 0.24, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
