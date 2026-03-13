'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [role, setRole] = useState('')

  const handleLogin = () => {
    if (role === 'student') router.push('/attendance')
    else if (role === 'admin') router.push('/dashboard')
    else if (role === 'platform') router.push('/platform-login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #006B3C 100%)',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Kenya Flag Top */}
      <div style={{
        height: '8px',
        background: 'linear-gradient(90deg, #000000 0%, #bb0000 33%, #000000 66%, #bb0000 100%)',
        borderRadius: '4px',
        marginBottom: '20px'
      }}></div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: '800',
          marginBottom: '10px'
        }}>
          <span style={{ color: '#006B3C' }}>Edu</span><span style={{ color: '#BB0000' }}>Track</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
          Smart School Management System 🇰🇪
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Student Attendance Card */}
        <div onClick={() => { setRole('student'); router.push('/attendance') }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#006B3C'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>📸</div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '10px' }}>Student Attendance</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>WiFi + Selfie Attendance</p>
        </div>

        {/* School Admin Card */}
        <div onClick={() => router.push('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#BB0000'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>🏫</div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '10px' }}>School Admin</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Dashboard & Management</p>
        </div>

        {/* Register School Card */}
        <div onClick={() => router.push('/register-institution')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#FFD700'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>➕</div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '10px' }}>Register School</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Add New Institution</p>
        </div>

        {/* Platform Admin Card */}
        <div onClick={() => router.push('/platform-login')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '30px',
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#FFFFFF'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>⚙️</div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '10px' }}>Platform Admin</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Super Admin Panel</p>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '50px',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.9rem'
      }}>
        <p>🇰🇪 Proudly Kenyan • Built by Prince Alpha K. Muchangi</p>
        <p>© 2026 EduTrack Kenya • Version 1.0.0</p>
      </div>

      {/* Kenya Flag Bottom */}
      <div style={{
        height: '8px',
        background: 'linear-gradient(90deg, #bb0000 0%, #000000 33%, #bb0000 66%, #000000 100%)',
        borderRadius: '4px',
        marginTop: '20px'
      }}></div>
    </div>
  )
}
