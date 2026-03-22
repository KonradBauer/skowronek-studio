'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface HLSPlayerProps {
  hlsSrc?: string
  fallbackSrc: string
}

export function HLSPlayer({ hlsSrc, fallbackSrc }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (hlsSrc && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hls.loadSource(hlsSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked by browser, user can click play
        })
      })
      return () => hls.destroy()
    }

    // Safari has native HLS support, or fall back to direct file
    video.src = hlsSrc || fallbackSrc
    video.play().catch(() => {
      // Autoplay blocked
    })
  }, [hlsSrc, fallbackSrc])

  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload"
      className="h-full w-full"
    />
  )
}
