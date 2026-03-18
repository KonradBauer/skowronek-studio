'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '@/stores/navigationStore'

const STRIPE_COUNT = 5
const STAGGER_DELAY = 0.06
const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1]

export function StripeTransition() {
  const isTransitioning = useNavigationStore((s) => s.isTransitioning)

  return (
    <AnimatePresence>
      {isTransitioning && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 origin-left bg-dark"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0, originX: 1 }}
              transition={{
                duration: 0.5,
                delay: i * STAGGER_DELAY,
                ease: EASE,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
