'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()
  const [stage, setStage] = useState(0)
  const [pulseScale, setPulseScale] = useState(1)
  const [confetti, setConfetti] = useState<{x: number, y: number, color: string, vx: number, vy: number}[]>([])

  useEffect(() => {
    const stages = [0, 1000, 2000, 3000, 4000, 5000]
    const timers: NodeJS.Timeout[] = []

    stages.forEach((delay, i) => {
      timers.push(setTimeout(() => setStage(i + 1), delay))
    })

    timers.push(setTimeout(() => router.push('/home'), 7000))

    return () => timers.forEach(clearTimeout)
  }, [router])

  useEffect(() => {
    let animFrame: number
    const pulse = () => {
      setPulseScale(prev => prev === 1 ? 1.08 : 1)
      animFrame = requestAnimationFrame(pulse)
    }
    
    if (stage >= 5) {
      setTimeout(() => pulse(), 100)
    }
    
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame)
    }
  }, [stage])

  useEffect(() => {
    if (stage === 6) {
      const colors = ['#BB0000', '#006B3C', '#000000', '#FFD700', '#FFFFFF']
      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * window.innerWidth,
        y: -20,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2
      }))
      setConfetti(particles)

      const animate = () => {
        setConfetti(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2
        })).filter(p => p.y < window.innerHeight + 50))
      }

      const interval = setInterval(animate, 30)
      return () => clearInterval(interval)
    }
  }, [stage])

  const kenyaCities = [
    { name: 'Nairobi', x: 55, y: 45 },
    { name: 'Mombasa', x: 65, y: 75 },
    { name: 'Kisumu', x: 40, y: 40 },
    { name: 'Nakuru', x: 40, y: 35 },
    { name: 'Eldoret', x: 30, y: 25 },
    { name: 'Malindi', x: 70, y: 70 },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Kenya Flag Top Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '12px',
        background: 'linear-gradient(90deg, #000000 0%, #bb0000 33%, #000000 66%, #bb0000 100%)',
        transform: stage >= 1 ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.5s ease'
      }}></div>

      {/* STAGE 1: Kenya Map with Dots */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '280px',
        opacity: stage >= 2 ? 1 : 0,
        transform: stage >= 2 ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 1s ease'
      }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <path
            d="M20,30 Q25,20 35,25 L45,20 Q55,15 65,20 L75,25 Q85,30 80,40 L85,50 Q90,60 85,70 L75,80 Q65,85 55,80 L45,85 Q35,90 25,85 L15,75 Q10,65 15,55 L10,45 Q10,35 20,30 Z"
            fill="none"
            stroke="#006B3C"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
        
        {kenyaCities.map((city, i) => (
          <div key={city.name} style={{
            position: 'absolute',
            left: `${city.x}%`,
            top: `${city.y}%`,
            width: stage >= 3 ? '12px' : '0px',
            height: stage >= 3 ? '12px' : '0px',
            borderRadius: '50%',
            background: '#BB0000',
            boxShadow: stage >= 3 ? '0 0 15px #BB0000, 0 0 30px #FFD700' : 'none',
            transition: 'all 0.5s ease',
            transitionDelay: `${i * 0.15}s`
          }} />
        ))}
      </div>

      {/* STAGE 2: Graduation Cap Drop */}
      <div style={{
        position: 'absolute',
        top: stage >= 4 ? '15%' : '-100px',
        fontSize: '80px',
        transition: 'top 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        opacity: stage >= 4 ? 1 : 0,
        filter: stage >= 4 ? 'drop-shadow(0 10px 30px rgba(187,0,0,0.5))' : 'none'
      }}>
        🎓
      </div>

      {/* STAGE 3: Books Opening */}
      <div style={{
        position: 'absolute',
        bottom: stage >= 4 ? '25%' : '-100px',
        display: 'flex',
        gap: '20px',
        transition: 'bottom 0.8s ease',
        opacity: stage >= 4 ? 1 : 0
      }}>
        <div style={{
          fontSize: '50px',
          transform: stage >= 4 ? 'rotate(-15deg)' : 'rotate(0deg)',
          transition: 'transform 0.6s ease 0.3s',
          filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))'
        }}>📚</div>
        <div style={{
          fontSize: '50px',
          transform: stage >= 4 ? 'rotate(15deg)' : 'rotate(0deg)',
          transition: 'transform 0.6s ease 0.4s',
          filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))'
        }}>📖</div>
        <div style={{
          fontSize: '50px',
          transform: stage >= 4 ? 'rotate(-10deg)' : 'rotate(0deg)',
          transition: 'transform 0.6s ease 0.5s',
          filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))'
        }}>📕</div>
      </div>

      {/* STAGE 4: Performance Bars */}
      <div style={{
        position: 'absolute',
        right: '10%',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '15px',
        opacity: stage >= 4 ? 1 : 0,
        transition: 'opacity 0.5s ease'
      }}>
        {[60, 85, 45, 95, 70].map((height, i) => (
          <div key={i} style={{
            width: '25px',
            height: stage >= 4 ? `${height}%` : '0%',
            maxHeight: '100px',
            background: `linear-gradient(to top, #006B3C, #10b981)`,
            borderRadius: '4px 4px 0 0',
            transition: `height 0.8s ease ${i * 0.1}s`,
            boxShadow: stage >= 4 ? '0 0 10px rgba(16,185,129,0.5)' : 'none'
          }} />
        ))}
      </div>

      {/* TECH STARTUP LOGO - Shield + Cap + Book + Glow */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}>
        <div style={{
          transform: `scale(${stage >= 5 ? pulseScale : 0})`,
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Shield with Glow */}
          <div style={{
            width: '120px',
            height: '150px',
            background: '#000000',
            borderRadius: '18px',
            border: '4px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: stage >= 5 ? `0 0 ${20 * pulseScale}px rgba(0,107,60,0.8), 0 0 ${40 * pulseScale}px rgba(0,107,60,0.4)` : 'none',
            transition: 'box-shadow 0.3s ease'
          }}>
            {/* Graduation Cap (red) */}
            <div style={{
              position: 'absolute',
              top: '15px',
              fontSize: '40px',
              color: '#BB0000',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}>🎓</div>
            
            {/* Open Book (white) */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              width: '80px',
              height: '25px',
              background: '#FFFFFF',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}></div>
          </div>

          {/* EduTrack Text */}
          <div style={{ marginTop: '20px' }}>
            <span style={{
              color: '#006B3C',
              fontSize: '42px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>Edu</span>
            <span style={{
              color: '#BB0000',
              fontSize: '42px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>Track</span>
          </div>

          {/* Tagline */}
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '16px',
            marginTop: '8px',
            fontWeight: '500'
          }}>
            Smart Student Performance System
          </p>
        </div>
      </div>

      {/* STAGE 6: Confetti */}
      {confetti.map((particle, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: particle.x,
          top: particle.y,
          width: '10px',
          height: '10px',
          background: particle.color,
          borderRadius: particle.color === '#FFFFFF' ? '50%' : '2px',
          pointerEvents: 'none'
        }} />
      ))}

      {/* Bottom Flag Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '12px',
        background: 'linear-gradient(90deg, #bb0000 0%, #000000 33%, #bb0000 66%, #000000 100%)',
        transform: stage >= 1 ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.5s ease 0.3s'
      }}></div>

      {/* Proudly Kenyan + Founder Credit */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        textAlign: 'center',
        opacity: stage >= 5 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.5s'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '2rem' }}>🇰🇪</span>
          <span style={{
            color: 'white',
            fontSize: '1.3rem',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            Proudly Built in Kenya
          </span>
        </div>
        
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '1rem',
          marginTop: '8px',
          fontWeight: '500'
        }}>
          Prince Alpha K. Muchangi
        </p>
      </div>

      {/* Version */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.7rem',
        letterSpacing: '1px'
      }}>
        © 2026 EduTrack Kenya • Version 1.0.0 • Premium Tech Startup Edition
      </div>
    </div>
  )
}
