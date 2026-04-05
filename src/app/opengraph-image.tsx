import { ImageResponse } from 'next/og'

export const alt = 'LoopTV - Random clips from your favorite channels, nonstop'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090B',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Red accent bar */}
        <div
          style={{
            width: 80,
            height: 6,
            background: '#DC2626',
            borderRadius: 3,
            marginBottom: 40,
            display: 'flex',
          }}
        />

        {/* Logo / Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* TV icon inline */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="6" fill="#18181B" />
            <rect
              x="3"
              y="6"
              width="26"
              height="20"
              rx="4"
              fill="#18181B"
              stroke="#3F3F46"
              strokeWidth="1.5"
            />
            <polygon points="13,10 13,22 23,16" fill="#DC2626" />
          </svg>
          <span
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#FAFAFA',
              letterSpacing: '-0.03em',
            }}
          >
            LoopTV
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            fontSize: 32,
            color: '#A1A1AA',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Random clips from your favorite channels, nonstop
        </span>

        {/* Stats line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: '#71717A',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            13 stations
          </span>
          <span style={{ fontSize: 20, color: '#DC2626' }}>
            &bull;
          </span>
          <span
            style={{
              fontSize: 20,
              color: '#71717A',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            38K videos
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
