'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  fullName: string
  role: string
  student?: {
    id: string
    class: string
    admissionNumber: string
    academicScore: number
    attendanceRate: number
  }
}

interface Announcement {
  id: string
  title: string
  message: string
  priority: string
  createdAt: string
  author: string
}

interface FeeInfo {
  schoolFeeAmount: number
  commissionFee: number
  totalPaid: number
  totalCommission: number
  balance: number
}

interface Performance {
  activities: any[]
  subjects: any[]
  summary: {
    totalActivities: number
    totalSubjects: number
    averageScore: number
    academicScore: number
    attendanceRate: number
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null)
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [timetable, setTimetable] = useState<any[]>([])
  const [isOffline, setIsOffline] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentPhone, setPaymentPhone] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    fetchData()
    
    window.addEventListener('online', () => setIsOffline(false))
    window.addEventListener('offline', () => setIsOffline(true))
    
    return () => {
      window.removeEventListener('online', () => setIsOffline(false))
      window.removeEventListener('offline', () => setIsOffline(true))
    }
  }, [router])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const [announcementsRes, feesRes, performanceRes, timetableRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/fees'),
        fetch('/api/performance'),
        fetch('/api/timetable')
      ])

      const announcementsData = await announcementsRes.json()
      const feesData = await feesRes.json()
      const performanceData = await performanceRes.json()
      const timetableData = await timetableRes.json()

      if (announcementsData.success) setAnnouncements(announcementsData.announcements)
      if (feesData.success) setFeeInfo(feesData.feeInfo)
      if (performanceData.success) setPerformance(performanceData.performance)
      if (timetableData.success) setTimetable(timetableData.timetable)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    const token = localStorage.getItem('token')
    setPaying(true)

    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: paymentPhone })
      })

      const data = await res.json()

      if (data.success) {
        alert(`STK Push sent to ${paymentPhone}. Please check your phone to complete payment.`)
        setShowPaymentModal(false)
        fetchData()
      } else {
        alert(data.error || 'Payment failed')
      }
    } catch (error) {
      alert('Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const initials = user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div>
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Some features may be limited.
        </div>
      )}

      <nav className="nav-header">
        <div className="container nav-content">
          <div className="nav-logo">EduTrack</div>
          <div className="nav-links">
            <a href="#" className="nav-link" onClick={() => setActiveTab('overview')}>Dashboard</a>
            {user?.role === 'admin' && (
              <a href="#" className="nav-link" onClick={() => setActiveTab('admin')}>Admin</a>
            )}
            <a href="#" className="nav-link" onClick={handleLogout}>Logout</a>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h2>{user?.fullName}</h2>
            <p>{user?.role} {user?.student ? `• ${user.student.class}` : ''}</p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>Fees</button>
          <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>
          <button className={`tab ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => setActiveTab('timetable')}>Timetable</button>
          <button className={`tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</button>
        </div>

        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            <div className="card stat-card">
              <span className="stat-label">Academic Score</span>
              <span className="stat-value">{performance?.summary.academicScore || 0}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${performance?.summary.academicScore || 0}%` }}></div>
              </div>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Attendance</span>
              <span className="stat-value">{performance?.summary.attendanceRate || 100}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${performance?.summary.attendanceRate || 100}%`, background: 'var(--accent)' }}></div>
              </div>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Fee Balance</span>
              <span className="stat-value" style={{ color: (feeInfo?.balance || 0) > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                KES {(feeInfo?.balance || 0).toLocaleString()}
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>of KES {feeInfo?.schoolFeeAmount.toLocaleString()}</p>
            </div>

            <div className="card stat-card">
              <span className="stat-label">Activities</span>
              <span className="stat-value">{performance?.summary.totalActivities || 0}</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Total activities</p>
            </div>

            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recent Announcements</h3>
              {announcements.length === 0 ? (
                <p style={{ color: 'var(--text-light)' }}>No announcements</p>
              ) : (
                announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className={`card announcement-card ${ann.priority}`} style={{ marginBottom: '0.5rem', padding: '1rem' }}>
                    <div className="announcement-title">{ann.title}</div>
                    <div className="announcement-meta">{new Date(ann.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => router.push('/attendance')}>
                  📸 Attendance & Login
                </button>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard/portfolio')}>
                  🎓 My E-Portfolio
                </button>
                <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                  Pay Fees
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('performance')}>
                  View Performance
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('timetable')}>
                  View Timetable
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && feeInfo && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Fee Summary</h2>
              <div className="grid grid-2">
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>School Fee Amount</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>KES {feeInfo.schoolFeeAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Total Paid</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>KES {feeInfo.totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Balance</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: feeInfo.balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    KES {feeInfo.balance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Your Commission (100 KES)</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)' }}>KES {feeInfo.totalCommission.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-accent" onClick={() => setShowPaymentModal(true)}>
                  Pay Now (KES {feeInfo.balance + feeInfo.commissionFee})
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  Includes 100 KES service fee per transaction
                </p>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Payment History</h3>
              {feeInfo.balance > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  You have a balance of KES {feeInfo.balance.toLocaleString()}. Please pay to avoid penalties.
                </div>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount Paid</th>
                    <th>Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td>KES {feeInfo.totalPaid.toLocaleString()}</td>
                    <td>KES {feeInfo.totalCommission.toLocaleString()}</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && performance && (
          <div className="dashboard-grid">
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: '1rem' }}>Academic Performance</h3>
              <div className="grid grid-2">
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Average Score</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{performance.summary.averageScore}%</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Subjects</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{performance.summary.totalSubjects}</p>
                </div>
              </div>
              {performance.subjects.length > 0 ? (
                <table className="table" style={{ marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Score</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.subjects.slice(0, 5).map((s: any, i: number) => (
                      <tr key={i}>
                        <td>{s.subject}</td>
                        <td>{s.score}%</td>
                        <td><span className={`badge ${s.score >= 60 ? 'badge-success' : 'badge-warning'}`}>{s.grade}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>No subject grades yet</p>
              )}
            </div>

            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: '1rem' }}>Extracurricular Activities</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Total: {performance.summary.totalActivities} activities
              </p>
              {performance.activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {performance.activities.slice(0, 5).map((a: any) => (
                    <div key={a.id} style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {a.category} • {a.level}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-light)' }}>No activities recorded yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Class Timetable</h2>
            <div className="timetable-grid">
              <div className="timetable-cell header">Time</div>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                <div key={day} className="timetable-cell header">{day}</div>
              ))}
              {['8:00', '9:00', '10:00', '10:30', '11:30', '12:30', '1:30', '2:30'].map((time, i) => (
                <>
                  <div key={`${time}-header`} className="timetable-cell time">{time}</div>
                  {[0, 1, 2, 3, 4].map(dayIdx => {
                    const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][dayIdx]
                    const slot = `${8 + (i >= 2 ? 1 : 0)}:${i % 2 === 0 ? '00' : '00'}-${9 + (i >= 2 ? 1 : 0)}:${i % 2 === 0 ? '00' : '00'}`
                    const entries = timetable.find(t => t.day === day)?.slots
                    const entry = entries?.[i]
                    return (
                      <div key={`${time}-${dayIdx}`} className="timetable-cell">
                        {entry?.subject || '-'}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>School Announcements</h2>
            {announcements.length === 0 ? (
              <div className="card">
                <p style={{ color: 'var(--text-light)' }}>No announcements yet</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className={`card announcement-card ${ann.priority}`} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div className="announcement-title">{ann.title}</div>
                      <div className="announcement-meta">
                        By {ann.author} • {new Date(ann.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {ann.priority === 'urgent' && <span className="badge badge-danger">Urgent</span>}
                    {ann.priority === 'important' && <span className="badge badge-warning">Important</span>}
                  </div>
                  <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminPanel onRefresh={fetchData} />
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pay School Fees</h2>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Payment Details:</strong><br/>
                School Fee: KES {feeInfo?.schoolFeeAmount.toLocaleString()}<br/>
                Service Fee: KES {feeInfo?.commissionFee}<br/>
                <strong>Total: KES {((feeInfo?.balance || 0) + (feeInfo?.commissionFee || 0)).toLocaleString()}</strong>
              </div>
              <div className="form-group">
                <label className="label">Phone Number (M-Pesa)</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="254700000000"
                  value={paymentPhone}
                  onChange={e => setPaymentPhone(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  Enter the phone number to receive STK Push
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handlePayment} disabled={paying || !paymentPhone}>
                {paying ? 'Processing...' : 'Pay via M-Pesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminPanel({ onRefresh }: { onRefresh: () => void }) {
  const [tab, setTab] = useState('announcements')
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', priority: 'normal', targetRole: 'all' })
  const [saving, setSaving] = useState(false)

  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(announcementForm)
      })

      if (res.ok) {
        alert('Announcement posted!')
        setAnnouncementForm({ title: '', message: '', priority: 'normal', targetRole: 'all' })
        onRefresh()
      }
    } catch (error) {
      alert('Failed to post announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Admin Panel</h2>
      <div className="tabs">
        <button className={`tab ${tab === 'announcements' ? 'active' : ''}`} onClick={() => setTab('announcements')}>Announcements</button>
        <button className={`tab ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>Students</button>
        <button className={`tab ${tab === 'hotspot' ? 'active' : ''}`} onClick={() => setTab('hotspot')}>Hotspot Admins</button>
      </div>

      {tab === 'announcements' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Post Announcement</h3>
          <form onSubmit={handleAnnouncement}>
            <div className="form-group">
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Message</label>
              <textarea
                className="input"
                rows={4}
                value={announcementForm.message}
                onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={announcementForm.priority}
                  onChange={e => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Target</label>
                <select
                  className="input"
                  value={announcementForm.targetRole}
                  onChange={e => setAnnouncementForm({...announcementForm, targetRole: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="parent">Parents</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Posting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
      )}

      {tab === 'students' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Student Management</h3>
          <p style={{ color: 'var(--text-light)' }}>Student management features coming soon...</p>
        </div>
      )}

      {tab === 'hotspot' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📡 Hotspot Admin Management</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Manage ClassReps and Unit Teachers who provide mobile hotspots for attendance.
            Maximum 8 hotspot admins allowed.
          </p>
          <a href="/dashboard/hotspot" className="btn btn-primary">
            Manage Hotspot Admins →
          </a>
        </div>
      )}
    </div>
  )
}
