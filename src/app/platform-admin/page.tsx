'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Institution {
  id: string
  name: string
  slug: string
  type: string
  country: string
  county: string
  phone: string
  email: string
  subscriptionStatus: string
  subscriptionPlan: string
  monthlyFee: number
  isActive: boolean
  createdAt: string
  _count: {
    students: number
    users: number
  }
}

export default function PlatformAdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'secondary',
    country: 'Kenya',
    county: '',
    phone: '',
    email: '',
    subscriptionPlan: 'basic',
    monthlyFee: 0
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (!userData || !token) {
      router.push('/platform-login')
      return
    }

    const parsed = JSON.parse(userData)
    if (parsed.role !== 'platform_admin') {
      router.push('/')
      return
    }

    setUser(parsed)
    fetchInstitutions()
  }, [router])

  const fetchInstitutions = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/institutions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setInstitutions(data.institutions)
      }
    } catch (e) {
      console.error('Failed to fetch institutions:', e)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    const url = editingInstitution ? '/api/institutions' : '/api/institutions'
    const method = editingInstitution ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingInstitution ? { ...formData, id: editingInstitution.id } : formData)
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        setEditingInstitution(null)
        setFormData({
          name: '',
          type: 'secondary',
          country: 'Kenya',
          county: '',
          phone: '',
          email: '',
          subscriptionPlan: 'basic',
          monthlyFee: 0
        })
        fetchInstitutions()
      } else {
        alert(data.error)
      }
    } catch (e) {
      console.error('Failed to save institution:', e)
    }
  }

  const handleEdit = (inst: Institution) => {
    setEditingInstitution(inst)
    setFormData({
      name: inst.name,
      type: inst.type,
      country: inst.country,
      county: inst.county || '',
      phone: inst.phone || '',
      email: inst.email || '',
      subscriptionPlan: inst.subscriptionPlan,
      monthlyFee: inst.monthlyFee
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution? This action cannot be undone.')) return
    
    const token = localStorage.getItem('token')
    try {
      await fetch(`/api/institutions?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchInstitutions()
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  const toggleStatus = async (inst: Institution) => {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/institutions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: inst.id,
          isActive: !inst.isActive
        })
      })
      fetchInstitutions()
    } catch (e) {
      console.error('Failed to update:', e)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/platform-login')
  }

  const stats = {
    total: institutions.length,
    active: institutions.filter(i => i.isActive).length,
    trial: institutions.filter(i => i.subscriptionStatus === 'trial').length,
    totalStudents: institutions.reduce((sum, i) => sum + i._count.students, 0)
  }

  return (
    <div>
      <nav className="nav-header">
        <div className="container nav-content">
          <div className="nav-logo">🎓 EduTrack Platform</div>
          <div className="nav-links">
            <a href="#" className="nav-link">Dashboard</a>
            <a href="#" className="nav-link" onClick={handleLogout}>Logout</a>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="page-header">
          <h1 className="page-title">🏛️ Platform Administration</h1>
          <p className="page-subtitle">Manage all institutions on EduTrack</p>
        </div>

        {/* Stats */}
        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <span className="stat-label">Total Institutions</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Active</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{stats.active}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Trial</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.trial}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{stats.totalStudents}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Institutions</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Institution
          </button>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : institutions.length === 0 ? (
            <div className="empty-state">No institutions yet. Add your first school!</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Type</th>
                  <th>Country</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(inst => (
                  <tr key={inst.id}>
                    <td>
                      <strong>{inst.name}</strong><br/>
                      <small style={{ color: 'var(--text-light)' }}>{inst.slug}</small>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{inst.type}</td>
                    <td>{inst.country}</td>
                    <td>
                      <span className={`badge ${
                        inst.subscriptionPlan === 'premium' ? 'badge-success' :
                        inst.subscriptionPlan === 'standard' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {inst.subscriptionPlan}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-secondary`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => toggleStatus(inst)}
                      >
                        {inst.isActive ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td>{inst._count.students}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleEdit(inst)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(inst.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingInstitution(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingInstitution ? 'Edit Institution' : 'Add New Institution'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="label">Institution Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Type *</label>
                    <select
                      className="input"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="training">Training Institute</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="label">Country *</label>
                    <select
                      className="input"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">County/State</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.county}
                      onChange={e => setFormData({...formData, county: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="label">Subscription Plan</label>
                    <select
                      className="input"
                      value={formData.subscriptionPlan}
                      onChange={e => setFormData({...formData, subscriptionPlan: e.target.value})}
                    >
                      <option value="basic">Basic - Free</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Monthly Fee (KES)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.monthlyFee}
                      onChange={e => setFormData({...formData, monthlyFee: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingInstitution(null) }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInstitution ? 'Update' : 'Create'} Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
