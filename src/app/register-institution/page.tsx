'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterInstitutionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [institutionData, setInstitutionData] = useState({
    name: '',
    type: 'secondary',
    country: 'Kenya',
    county: '',
    phone: '',
    email: ''
  })
  const [adminData, setAdminData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const handleInstitutionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (adminData.password !== adminData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (adminData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Create institution first
      const instRes = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(institutionData)
      })

      const instData = await instRes.json()

      if (!instData.success) {
        throw new Error(instData.error || 'Failed to create institution')
      }

      const institution = instData.institution

      // Create admin user
      const userRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adminData,
          role: 'admin',
          institutionId: institution.id
        })
      })

      const userData = await userRes.json()

      if (!userData.success) {
        throw new Error(userData.error || 'Failed to create admin account')
      }

      alert(`Institution "${institution.name}" created successfully!`)
      router.push('/')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
      padding: '2rem 1rem'
    }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Register Your Institution</h1>
          <p style={{ color: 'var(--text-light)' }}>
            Step {step} of 2: {step === 1 ? 'Institution Details' : 'Admin Account'}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '4px', background: step >= 1 ? '#10b981' : '#e2e8f0', borderRadius: '2px' }}></div>
          <div style={{ flex: 1, height: '4px', background: step >= 2 ? '#10b981' : '#e2e8f0', borderRadius: '2px' }}></div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {step === 1 && (
          <form onSubmit={handleInstitutionSubmit}>
            <div className="form-group">
              <label className="label">Institution Name *</label>
              <input
                type="text"
                className="input"
                value={institutionData.name}
                onChange={e => setInstitutionData({...institutionData, name: e.target.value})}
                placeholder="e.g., Mukiria Secondary School"
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">Institution Type *</label>
                <select
                  className="input"
                  value={institutionData.type}
                  onChange={e => setInstitutionData({...institutionData, type: e.target.value})}
                >
                  <option value="primary">Primary School</option>
                  <option value="secondary">Secondary School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="training">Training Institute</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Country *</label>
                <select
                  className="input"
                  value={institutionData.country}
                  onChange={e => setInstitutionData({...institutionData, country: e.target.value})}
                >
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">County/State</label>
              <input
                type="text"
                className="input"
                value={institutionData.county}
                onChange={e => setInstitutionData({...institutionData, county: e.target.value})}
                placeholder="e.g., Kirinyaga"
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={institutionData.phone}
                  onChange={e => setInstitutionData({...institutionData, phone: e.target.value})}
                  placeholder="254700000000"
                />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={institutionData.email}
                  onChange={e => setInstitutionData({...institutionData, email: e.target.value})}
                  placeholder="info@school.edu"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Continue →
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleAdminSubmit}>
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input"
                value={adminData.fullName}
                onChange={e => setAdminData({...adminData, fullName: e.target.value})}
                placeholder="Principal/Administrator Name"
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={adminData.email}
                  onChange={e => setAdminData({...adminData, email: e.target.value})}
                  placeholder="admin@school.edu"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={adminData.phone}
                  onChange={e => setAdminData({...adminData, phone: e.target.value})}
                  placeholder="254700000000"
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  value={adminData.password}
                  onChange={e => setAdminData({...adminData, password: e.target.value})}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Confirm Password *</label>
                <input
                  type="password"
                  className="input"
                  value={adminData.confirmPassword}
                  onChange={e => setAdminData({...adminData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            <div style={{ 
              padding: '1rem', 
              background: '#dbeafe', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Institution Summary:</strong><br/>
              Name: {institutionData.name}<br/>
              Type: {institutionData.type}<br/>
              Country: {institutionData.country}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Institution'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a href="/" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
