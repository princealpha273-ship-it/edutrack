'use client'

import { useEffect, useState } from 'react'

interface HotspotAdmin {
  id: string
  fullName: string
  phone: string
  role: string
  unit: string
  hotspotName: string
  isActive: boolean
  isOnline: boolean
  createdAt: string
}

export default function HotspotAdminPage() {
  const [hotspots, setHotspots] = useState<HotspotAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHotspot, setEditingHotspot] = useState<HotspotAdmin | null>(null)
  const [count, setCount] = useState(0)
  const [maxAllowed] = useState(8)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    role: 'unit_teacher',
    unit: '',
    hotspotName: ''
  })

  useEffect(() => {
    fetchHotspots()
  }, [])

  const fetchHotspots = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/hotspot', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setHotspots(data.hotspots)
        setCount(data.count)
      }
    } catch (e) {
      console.error('Failed to fetch hotspots:', e)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/hotspot', {
        method: editingHotspot ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingHotspot ? { ...formData, id: editingHotspot.id } : formData)
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        setEditingHotspot(null)
        setFormData({ fullName: '', phone: '', role: 'unit_teacher', unit: '', hotspotName: '' })
        fetchHotspots()
      } else {
        alert(data.error)
      }
    } catch (e) {
      console.error('Failed to save:', e)
    }
  }

  const handleEdit = (hotspot: HotspotAdmin) => {
    setEditingHotspot(hotspot)
    setFormData({
      fullName: hotspot.fullName,
      phone: hotspot.phone,
      role: hotspot.role,
      unit: hotspot.unit || '',
      hotspotName: hotspot.hotspotName
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this hotspot admin?')) return

    const token = localStorage.getItem('token')
    try {
      await fetch(`/api/hotspot?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchHotspots()
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  const toggleStatus = async (hotspot: HotspotAdmin) => {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/hotspot', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: hotspot.id, isActive: !hotspot.isActive })
      })
      fetchHotspots()
    } catch (e) {
      console.error('Failed to update:', e)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">📡 Hotspot Admin Management</h1>
            <p className="page-subtitle">
              Manage ClassReps and Unit Teachers who provide mobile hotspots for attendance
            </p>
          </div>
          {count < maxAllowed && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add Hotspot Admin
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#dbeafe' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>🔐 Security Information</h3>
        <ul style={{ marginLeft: '1.5rem', color: '#1e40af' }}>
          <li>Only hotspots from registered ClassReps or Unit Teachers can be used for attendance</li>
          <li>Maximum of <strong>{maxAllowed}</strong> hotspot admins per institution</li>
          <li>Currently registered: <strong>{count}/{maxAllowed}</strong></li>
          <li>Students must connect to one of these hotspots to mark attendance automatically</li>
        </ul>
      </div>

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <span className="stat-label">Total Registered</span>
          <span className="stat-value">{count}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Active</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {hotspots.filter(h => h.isActive).length}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">ClassReps</span>
          <span className="stat-value">
            {hotspots.filter(h => h.role === 'classrep').length}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Unit Teachers</span>
          <span className="stat-value">
            {hotspots.filter(h => h.role === 'unit_teacher').length}
          </span>
        </div>
      </div>

      {/* Hotspots Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Registered Hotspot Providers</h3>
        
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : hotspots.length === 0 ? (
          <div className="empty-state">
            No hotspot admins registered yet.<br/>
            Add up to {maxAllowed} ClassReps or Unit Teachers.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Unit/Class</th>
                <th>Hotspot Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map(hotspot => (
                <tr key={hotspot.id}>
                  <td><strong>{hotspot.fullName}</strong></td>
                  <td>{hotspot.phone}</td>
                  <td>
                    <span className={`badge ${hotspot.role === 'classrep' ? 'badge-info' : 'badge-success'}`}>
                      {hotspot.role === 'classrep' ? 'ClassRep' : 'Unit Teacher'}
                    </span>
                  </td>
                  <td>{hotspot.unit || '-'}</td>
                  <td>{hotspot.hotspotName}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => toggleStatus(hotspot)}
                    >
                      {hotspot.isActive ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleEdit(hotspot)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(hotspot.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingHotspot(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHotspot ? 'Edit' : 'Add'} Hotspot Admin</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  ⚠️ Maximum {maxAllowed} hotspot admins allowed. You can add {maxAllowed - count} more.
                </div>

                <div className="form-group">
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="254700000000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Role *</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="unit_teacher">Unit Teacher</option>
                    <option value="classrep">Class Representative</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Unit/Class</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    placeholder="Form 2A or Science Department"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Hotspot Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.hotspotName}
                    onChange={e => setFormData({...formData, hotspotName: e.target.value})}
                    placeholder="Mr. John's Hotspot"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingHotspot(null) }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHotspot ? 'Update' : 'Add'} Hotspot Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
