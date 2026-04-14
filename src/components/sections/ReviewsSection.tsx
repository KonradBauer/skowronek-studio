'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
          fill={i < count ? '#E8A84B' : '#D8DFE8'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="flex h-full flex-col bg-white p-8 shadow-sm">
      <div className="mb-5 text-3xl font-light text-accent leading-none select-none">&ldquo;</div>
      <p className="flex-1 leading-relaxed text-body">
        {review.text}
      </p>
      <div className="mt-6 border-t border-warm-gray pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {review.profilePhoto && (
              <Image
                src={review.profilePhoto}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
                unoptimized
              />
            )}
            <div>
              <p className="text-sm font-medium text-dark">{review.author}</p>
              <p className="text-xs text-body-muted">{review.date}</p>
            </div>
          </div>
          <Stars count={review.rating} />
        </div>
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
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">Opinie</p>
            <Heading as="h2">Co mówią nasi klienci</Heading>
          </div>
          <div className="flex items-center gap-2 md:mb-1">
            <Stars count={Math.round(rating)} />
            <span className="text-sm text-body">
              {rating.toFixed(1)} na Google
              {totalReviews > 0 && ` · ${totalReviews} opinii`}
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
                key={idx}
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
      <div className="mt-8 flex items-center justify-center gap-1">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="flex min-h-11 min-w-11 items-center justify-center"
            aria-label={`Opinia ${i + 1}`}
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-accent' : 'w-1.5 bg-warm-gray hover:bg-accent/50'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Link to all reviews */}
      <AnimatedSection delay={0.4}>
        <div className="mt-8 text-center">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm uppercase tracking-[0.15em] text-accent transition-colors hover:text-primary"
          >
            Zobacz wszystkie opinie na Google &rarr;
          </a>
        </div>
      </AnimatedSection>
    </Section>
  )
}
