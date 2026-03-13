'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlatformLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For demo, hardcoded platform admin
      // In production, this would validate against the database
      if (email === 'admin@edutrack.com' && password === 'platform2024') {
        const token = 'platform-admin-token-' + Date.now()
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify({
          id: 'platform-admin',
          email,
          fullName: 'Platform Administrator',
          role: 'platform_admin'
        }))
        router.push('/platform-admin')
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>EduTrack Platform</h1>
          <p style={{ color: 'var(--text-light)' }}>Super Admin Login</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@edutrack.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="platform2024"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Platform'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
            ← Back to School Login
          </a>
        </div>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#fef3c7', 
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#92400e'
        }}>
          <strong>Demo Credentials:</strong><br/>
          Email: admin@edutrack.com<br/>
          Password: platform2024
        </div>
      </div>
    </div>
  )
}
