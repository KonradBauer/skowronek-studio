'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

// Ken Burns timing - these values define the hero feel
const INTERVAL = 6000       // ms between slides
const ZOOM_DURATION = 6     // seconds for zoom animation
const CROSSFADE_DURATION = 1.5 // seconds for opacity transition

interface HeroData {
  images: string[]
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
}

export function HeroSection({ data }: { data: HeroData }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % data.images.length)
  }, [data.images.length])

  useEffect(() => {
    if (data.images.length <= 1) return
    const timer = setInterval(advance, INTERVAL)
    return () => clearInterval(timer)
  }, [advance, data.images.length])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Images with Ken Burns */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: CROSSFADE_DURATION, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.images[currentIndex]})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: ZOOM_DURATION, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-dark/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-transparent to-dark/60" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end px-8 pb-20 text-white md:px-16 lg:px-24">
        <motion.div
          className="mb-6 flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="h-[1px] w-12 bg-accent" />
          <p className="text-xs uppercase tracking-[0.35em] text-white/70 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {data.subtitle}
          </p>
        </motion.div>

        <motion.h1
          className="mb-8 max-w-2xl text-5xl font-normal italic leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-6xl lg:text-7xl"
          style={{ color: '#ffffff' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          {data.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <Button variant="outline" size="lg" href={data.ctaLink} className="border-white/60 text-white hover:bg-white/15 hover:border-white">
            {data.ctaText}
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator - right side */}
      <motion.div
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2 md:right-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="h-16 w-[1px] bg-white/30"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top' }}
        />
      </motion.div>
    </section>
  )
}
