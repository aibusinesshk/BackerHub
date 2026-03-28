import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = "BackerHub - Asia's Poker Backing Platform";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1d24 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Gold accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #f5b81c, transparent)',
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f5b81c, #d4a017)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
              color: '#000',
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -2,
            }}
          >
            BackerHub
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#f5b81c',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Back Players. Share Victories.
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Asia&apos;s premier poker tournament staking platform.
          Invest in verified players and share in their tournament winnings.
        </div>

        {/* Bottom badges */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 48,
          }}
        >
          {['Verified Players', 'Escrow Protected', 'Crypto Payments'].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  padding: '10px 24px',
                  borderRadius: 999,
                  border: '1px solid rgba(245,184,28,0.3)',
                  background: 'rgba(245,184,28,0.08)',
                  color: '#f5b81c',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
