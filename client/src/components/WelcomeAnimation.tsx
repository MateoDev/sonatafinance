import { useState, useEffect } from 'react';

interface WelcomeAnimationProps {
  userName: string;
  onComplete: () => void;
}

export function WelcomeAnimation({ userName, onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'logo' | 'greeting' | 'tagline' | 'fade-out'>('logo');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('greeting'), 1200),
      setTimeout(() => setPhase('tagline'), 2800),
      setTimeout(() => setPhase('fade-out'), 4600),
      setTimeout(() => onComplete(), 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        transition: 'opacity 0.8s ease',
        opacity: phase === 'fade-out' ? 0 : 1,
      }}
    >
      <style>{`
        @keyframes logoReveal {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineExpand {
          0% { width: 0; opacity: 0; }
          100% { width: 64px; opacity: 0.3; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          animation: 'logoReveal 0.8s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0a0a0a',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            S
          </span>
        </div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#666',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          Sonata
        </span>
      </div>

      <div
        style={{
          marginTop: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          minHeight: '80px',
        }}
      >
        {(phase === 'greeting' || phase === 'tagline' || phase === 'fade-out') && (
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 300,
              color: '#ffffff',
              fontFamily: "'Inter', -apple-system, sans-serif",
              animation: 'slideUp 0.6s ease-out forwards',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Welcome, {firstName}
          </h1>
        )}

        {(phase === 'tagline' || phase === 'fade-out') && (
          <>
            <div
              style={{
                height: '1px',
                backgroundColor: '#ffffff',
                animation: 'lineExpand 0.5s ease-out forwards',
              }}
            />
            <p
              style={{
                fontSize: '15px',
                fontWeight: 400,
                color: '#888',
                fontFamily: "'Inter', -apple-system, sans-serif",
                animation: 'slideUp 0.5s ease-out forwards',
                margin: 0,
              }}
            >
              Your financial command center is ready
            </p>
          </>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          display: 'flex',
          gap: '6px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
