'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '@/stores/navigationStore'
import { Navigation } from './Navigation'

export function MobileMenu() {
  const isMenuOpen = useNavigationStore((s) => s.isMenuOpen)
  const closeMenu = useNavigationStore((s) => s.closeMenu)

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-cream"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
          >
            <Navigation vertical onItemClick={closeMenu} className="text-center" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
