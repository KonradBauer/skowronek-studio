'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/90',
  outline:
    'border border-primary text-primary hover:bg-primary hover:text-white',
  ghost:
    'text-body hover:text-dark hover:bg-warm-gray/30',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, href, ...props }, ref) => {
    const classes = `
      inline-flex items-center justify-center font-medium tracking-wide
      transition-all duration-[var(--duration-normal)] ease-[var(--ease-smooth)]
      cursor-pointer select-none
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `.trim()

    if (href) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      )
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
