'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'
import type { GoogleReview } from '@/lib/google-reviews'

const INTERVAL = 5000
const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Skowronek+Studio/@50.826258,19.095474,17z/data=!3m1!4b1!4m6!3m5!1s0x4710b7a1f9da3c9d:0xec191a5533d2b0e3!8m2!3d50.826258!4d19.095474!16s%2Fg%2F11y4b2t9cl'

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? '#FBBC04' : '#E8E2DA'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="flex h-full flex-col border border-input-border bg-white p-8">
      <Stars count={review.rating} />
      <p className="mt-4 flex-1 leading-relaxed text-body italic">
        &ldquo;{review.text}&rdquo;
      </p>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {review.profilePhoto && (
            <img
              src={review.profilePhoto}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <p className="text-sm font-medium text-dark">{review.author}</p>
        </div>
        <p className="text-xs text-body-muted">{review.date}</p>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-body-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span className="text-xs">Opinia Google</span>
      </div>
    </div>
  )
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<GoogleReview[]>([])
  const [rating, setRating] = useState(5)
  const [totalReviews, setTotalReviews] = useState(0)
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews)
        setRating(data.rating)
        setTotalReviews(data.totalReviews)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const advance = useCallback(() => {
    if (reviews.length === 0) return
    setCurrent((prev) => (prev + 1) % reviews.length)
  }, [reviews.length])

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL)
    return () => clearInterval(timer)
  }, [advance])

  if (!loaded || reviews.length === 0) {
    return null
  }

  const getVisibleReviews = () => {
    const indices = []
    for (let i = 0; i < Math.min(3, reviews.length); i++) {
      indices.push((current + i) % reviews.length)
    }
    return indices
  }

  const visibleIndices = getVisibleReviews()

  return (
    <Section id="reviews" alternate>
      <AnimatedSection>
        <div className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Opinie</p>
          <Heading as="h2">Co mowia nasi klienci</Heading>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Stars count={Math.round(rating)} />
            <span className="text-sm text-body">
              {rating.toFixed(1)} na Google
              {totalReviews > 0 && ` (${totalReviews} opinii)`}
            </span>
          </div>
        </div>
      </AnimatedSection>

      {/* Desktop: 3 cards carousel */}
      <div className="hidden md:block">
        <div className="grid grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {visibleIndices.map((idx) => (
              <motion.div
                key={`${idx}-${current}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              >
                <ReviewCard review={reviews[idx]} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: single card carousel */}
      <div className="md:hidden">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
            >
              <ReviewCard review={reviews[current]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-primary' : 'w-2 bg-warm-gray hover:bg-primary/40'
            }`}
            aria-label={`Opinia ${i + 1}`}
          />
        ))}
      </div>

      {/* Link to all reviews */}
      <AnimatedSection delay={0.4}>
        <div className="mt-8 text-center">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-[0.15em] text-primary transition-colors hover:text-primary-dark"
          >
            Zobacz wszystkie opinie na Google &rarr;
          </a>
        </div>
      </AnimatedSection>
    </Section>
  )
}
