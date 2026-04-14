import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Foto Studio - Fotografia slubna, portretowa i rodzinna'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
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
        {/* Decorative top bar */}
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

        {/* Decorative bottom bar */}
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

        {/* Decorative corner elements */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            width: '60px',
            height: '60px',
            borderTop: '2px solid #826D4C',
            borderLeft: '2px solid #826D4C',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            width: '60px',
            height: '60px',
            borderTop: '2px solid #826D4C',
            borderRight: '2px solid #826D4C',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            width: '60px',
            height: '60px',
            borderBottom: '2px solid #826D4C',
            borderLeft: '2px solid #826D4C',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            width: '60px',
            height: '60px',
            borderBottom: '2px solid #826D4C',
            borderRight: '2px solid #826D4C',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          {/* Studio name */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 300,
              color: '#2C2420',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Foto Studio
          </div>

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '2px',
              backgroundColor: '#826D4C',
              margin: '8px 0',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: '22px',
              fontWeight: 400,
              color: '#826D4C',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Fotografia z pasja
          </div>

          {/* Services */}
          <div
            style={{
              fontSize: '16px',
              color: '#6F6A63',
              letterSpacing: '0.1em',
              marginTop: '24px',
              textTransform: 'uppercase',
            }}
          >
            Slubna - Portretowa - Rodzinna - Film
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
