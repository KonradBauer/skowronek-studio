import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { seoConfig } from '@/lib/seo'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || seoConfig.siteName
  const tagline = searchParams.get('tagline') || 'Fotografia z pasją'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F2',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: '#826D4C',
          }}
        />
        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: '#826D4C',
          }}
        />

        {/* Corner brackets */}
        {[
          { top: '40px', left: '40px', borderTop: '2px solid #826D4C', borderLeft: '2px solid #826D4C' },
          { top: '40px', right: '40px', borderTop: '2px solid #826D4C', borderRight: '2px solid #826D4C' },
          { bottom: '40px', left: '40px', borderBottom: '2px solid #826D4C', borderLeft: '2px solid #826D4C' },
          { bottom: '40px', right: '40px', borderBottom: '2px solid #826D4C', borderRight: '2px solid #826D4C' },
        ].map((style, i) => (
          <div
            key={i}
            style={{ position: 'absolute', width: '60px', height: '60px', ...style }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: title.length > 30 ? '52px' : '68px',
              fontWeight: 300,
              color: '#2C2420',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              textAlign: 'center',
              maxWidth: '960px',
            }}
          >
            {title}
          </div>

          <div
            style={{
              width: '80px',
              height: '2px',
              backgroundColor: '#826D4C',
              margin: '8px 0',
            }}
          />

          <div
            style={{
              fontSize: '22px',
              fontWeight: 400,
              color: '#826D4C',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              fontSize: '15px',
              color: '#6F6A63',
              letterSpacing: '0.1em',
              marginTop: '20px',
              textTransform: 'uppercase',
            }}
          >
            Ślubna · Portretowa · Rodzinna · Film
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
