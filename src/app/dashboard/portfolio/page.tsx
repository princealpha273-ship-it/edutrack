'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Portfolio {
  id: string
  portfolioUrl: string
  bio: string
  aboutMe: string
  interests: string
  skills: string
  achievements: string
  certifications: string
  projects: string
  clubs: string
  sports: string
  leadership: string
  volunteer: string
  references: string
  linkedIn: string
  twitter: string
  github: string
  website: string
  isPublic: boolean
  shareableLink: string
  student: {
    class: string
    user: { fullName: string }
  }
}

function parseJsonField(field: string | null): any[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

export default function EPortfolioPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [generatedLink, setGeneratedLink] = useState('')
  const [formData, setFormData] = useState({
    portfolioUrl: '',
    bio: '',
    aboutMe: '',
    interests: '',
    skills: '',
    achievements: [] as string[],
    certifications: [] as string[],
    projects: [] as string[],
    clubs: [] as string[],
    sports: [] as string[],
    leadership: [] as string[],
    volunteer: [] as string[],
    references: [] as string[],
    linkedIn: '',
    twitter: '',
    github: '',
    website: '',
    isPublic: false
  })

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.portfolio) {
        setPortfolio(data.portfolio)
        setFormData({
          portfolioUrl: data.portfolio.portfolioUrl || '',
          bio: data.portfolio.bio || '',
          aboutMe: data.portfolio.aboutMe || '',
          interests: data.portfolio.interests || '',
          skills: data.portfolio.skills || '',
          achievements: parseJsonField(data.portfolio.achievements),
          certifications: parseJsonField(data.portfolio.certifications),
          projects: parseJsonField(data.portfolio.projects),
          clubs: parseJsonField(data.portfolio.clubs),
          sports: parseJsonField(data.portfolio.sports),
          leadership: parseJsonField(data.portfolio.leadership),
          volunteer: parseJsonField(data.portfolio.volunteer),
          references: parseJsonField(data.portfolio.references),
          linkedIn: data.portfolio.linkedIn || '',
          twitter: data.portfolio.twitter || '',
          github: data.portfolio.github || '',
          website: data.portfolio.website || '',
          isPublic: data.portfolio.isPublic || false
        })
        setGeneratedLink(data.portfolio.shareableLink || '')
      }
    } catch (e) {
      console.error('Failed to fetch portfolio:', e)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        alert('Portfolio saved successfully!')
        setGeneratedLink(data.shareableLink || generatedLink)
        fetchPortfolio()
      }
    } catch (e) {
      console.error('Failed to save:', e)
    }
    setSaving(false)
  }

  const handleArrayChange = (field: string, value: string) => {
    const items = value.split(',').map(i => i.trim()).filter(i => i)
    setFormData({ ...formData, [field]: items })
  }

  const addArrayItem = (field: string) => {
    const newItem = prompt(`Add new ${field.slice(0, -1)}:`)
    if (newItem) {
      setFormData({ ...formData, [field]: [...formData[field as keyof typeof formData] as string[], newItem] })
    }
  }

  const removeArrayItem = (field: string, index: number) => {
    const items = [...formData[field as keyof typeof formData] as string[]]
    items.splice(index, 1)
    setFormData({ ...formData, [field]: items })
  }

  const generateNewLink = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedLink(data.shareableLink)
        alert('New shareable link generated!')
      }
    } catch (e) {
      console.error('Failed to generate link:', e)
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎓 My E-Portfolio</h1>
        <p className="page-subtitle">Build your digital portfolio and share with universities & employers</p>
      </div>

      {/* Shareable Link */}
      {generatedLink && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#d1fae5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>🔗 Your Portfolio Link</h3>
              <code style={{ fontSize: '1rem' }}>https://edutrack.com/p/{generatedLink}</code>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(`https://edutrack.com/p/${generatedLink}`)}>
                Copy Link
              </button>
              <button className="btn btn-primary" onClick={generateNewLink}>
                Generate New
              </button>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              Make portfolio public (anyone with link can view)
            </label>
          </div>
        </div>
      )}

      {/* External Portfolio Link */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🔗 Link External Portfolio</h3>
        <div className="form-group">
          <label className="label">Portfolio URL (optional)</label>
          <input
            type="url"
            className="input"
            value={formData.portfolioUrl}
            onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
            placeholder="https://yourname.portfolio.com or LinkedIn URL"
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            Link your existing portfolio from platforms like Canva, Wix, or LinkedIn
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['basic', 'achievements', 'activities', 'contact'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'basic' && '📝 Basic Info'}
            {tab === 'achievements' && '🏆 Achievements'}
            {tab === 'activities' && '⚽ Activities'}
            {tab === 'contact' && '📧 Contact'}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Basic Information</h3>
          
          <div className="form-group">
            <label className="label">Short Bio</label>
            <input
              type="text"
              className="input"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="A brief tagline about yourself"
            />
          </div>

          <div className="form-group">
            <label className="label">About Me</label>
            <textarea
              className="input"
              rows={4}
              value={formData.aboutMe}
              onChange={e => setFormData({ ...formData, aboutMe: e.target.value })}
              placeholder="Tell us about yourself, your goals, and what makes you unique..."
            />
          </div>

          <div className="form-group">
            <label className="label">Interests (comma separated)</label>
            <input
              type="text"
              className="input"
              value={formData.interests}
              onChange={e => handleArrayChange('interests', e.target.value)}
              placeholder="Technology, Sports, Music, Reading"
            />
          </div>

          <div className="form-group">
            <label className="label">Skills (comma separated)</label>
            <input
              type="text"
              className="input"
              value={formData.skills}
              onChange={e => handleArrayChange('skills', e.target.value)}
              placeholder="Programming, Leadership, Communication"
            />
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Achievements & Certifications</h3>

          <div className="form-group">
            <label className="label">Academic Achievements</label>
            {formData.achievements.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('achievements', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('achievements')}>
              + Add Achievement
            </button>
          </div>

          <div className="form-group">
            <label className="label">Certifications</label>
            {formData.certifications.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('certifications', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('certifications')}>
              + Add Certification
            </button>
          </div>

          <div className="form-group">
            <label className="label">Projects</label>
            {formData.projects.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('projects', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('projects')}>
              + Add Project
            </button>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Extracurricular Activities</h3>

          <div className="form-group">
            <label className="label">Clubs & Organizations</label>
            {formData.clubs.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('clubs', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('clubs')}>
              + Add Club
            </button>
          </div>

          <div className="form-group">
            <label className="label">Sports</label>
            {formData.sports.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('sports', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('sports')}>
              + Add Sport
            </button>
          </div>

          <div className="form-group">
            <label className="label">Leadership Roles</label>
            {formData.leadership.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('leadership', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('leadership')}>
              + Add Leadership Role
            </button>
          </div>

          <div className="form-group">
            <label className="label">Volunteer Work</label>
            {formData.volunteer.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('volunteer', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('volunteer')}>
              + Add Volunteer Work
            </button>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Social Links</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="label">LinkedIn</label>
              <input
                type="url"
                className="input"
                value={formData.linkedIn}
                onChange={e => setFormData({ ...formData, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>

            <div className="form-group">
              <label className="label">Twitter/X</label>
              <input
                type="text"
                className="input"
                value={formData.twitter}
                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="@yourhandle"
              />
            </div>

            <div className="form-group">
              <label className="label">GitHub</label>
              <input
                type="text"
                className="input"
                value={formData.github}
                onChange={e => setFormData({ ...formData, github: e.target.value })}
                placeholder="yourusername"
              />
            </div>

            <div className="form-group">
              <label className="label">Personal Website</label>
              <input
                type="url"
                className="input"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourname.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">References</label>
            {formData.references.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={item} readOnly />
                <button className="btn btn-danger" onClick={() => removeArrayItem('references', i)}>×</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => addArrayItem('references')}>
              + Add Reference
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Portfolio'}
        </button>
      </div>
    </div>
  )
}
