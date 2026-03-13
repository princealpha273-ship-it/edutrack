'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  fullName: string
  role: string
  student?: {
    id: string
    class: string
  }
}

interface AttendanceRecord {
  id: string
  studentId?: string
  staffName?: string
  studentName?: string
  class?: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  status: string
  wifi?: string
}

interface Statistics {
  total: number
  present: number
  absent: number
  late?: number
  presentPercentage: number
}

export default function AttendancePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'visitor' | 'login'>('login')
  const [loading, setLoading] = useState(true)
  
  // WiFi state
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiBSSID, setWifiBSSID] = useState('')
  const [isWithinWifi, setIsWithinWifi] = useState(false)
  const [wifiStatus, setWifiStatus] = useState('checking')
  
  // Login state
  const [loginType, setLoginType] = useState<'student' | 'staff' | 'nonstaff'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selfieImage, setSelfieImage] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  
  // Non-staff form
  const [visitorName, setVisitorName] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorOrg, setVisitorOrg] = useState('')
  const [visitorPurpose, setVisitorPurpose] = useState('')
  
  // Attendance data
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    checkWifi()
    fetchAttendance()
  }, [activeTab, selectedDate])

  const checkWifi = async () => {
    setWifiStatus('checking')
    try {
      // In a real app, you'd use a WiFi API or network info
      // For demo, we'll check if WiFi name is available
      const nav = navigator as any
      if (nav.connection) {
        const conn = nav.connection
        setWifiSSID(conn.ssid || 'Mukiria-School-WiFi')
        setWifiBSSID(conn.bssid || '')
      }
      
      // Simulate WiFi check
      setTimeout(() => {
        setWifiStatus('connected')
        setIsWithinWifi(true)
      }, 1000)
    } catch (e) {
      setWifiStatus('unavailable')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraOn(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setLoginError('Could not access camera')
    }
  }

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      const image = canvas.toDataURL('image/jpeg', 0.8)
      setSelfieImage(image)
      stopCamera()
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setCameraOn(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)

    try {
      const res = await fetch('/api/wifi-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginType === 'nonstaff' ? undefined : email,
          password: loginType === 'nonstaff' ? undefined : password,
          selfieImage,
          wifiSSID,
          wifiBSSID,
          sessionType: loginType,
          fullName: loginType === 'nonstaff' ? visitorName : undefined,
          phone: loginType === 'nonstaff' ? visitorPhone : undefined,
          organization: loginType === 'nonstaff' ? visitorOrg : undefined,
          purpose: loginType === 'nonstaff' ? visitorPurpose : undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (loginType === 'nonstaff') {
        alert(`Check-in successful! Pass Number: ${data.visitor?.passNumber}`)
        setVisitorName('')
        setVisitorPhone('')
        setVisitorOrg('')
        setVisitorPurpose('')
        setSelfieImage('')
      } else {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        if (data.attendanceMarked) {
          setAttendanceMarked(true)
          alert('Login successful! Attendance marked as present.')
        }
        
        setUser(data.user)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setLoginError(err.message)
    } finally {
      setLoggingIn(false)
    }
  }

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    let url = ''
    if (activeTab === 'student') {
      url = `/api/attendance/student?date=${selectedDate}`
    } else if (activeTab === 'staff') {
      url = `/api/attendance/staff?date=${selectedDate}`
    } else if (activeTab === 'visitor') {
      url = `/api/attendance/visitor?date=${selectedDate}`
    }

    if (url) {
      try {
        const res = await fetch(url, { headers })
        const data = await res.json()
        if (data.success) {
          setAttendance(data.attendance || data.visitors || [])
          setStatistics(data.statistics)
        }
      } catch (e) {
        console.error('Fetch attendance error:', e)
      }
    }
    setLoading(false)
  }

  const markAttendance = async (studentId: string, status: string) => {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/attendance/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId, date: selectedDate, status })
      })
      fetchAttendance()
    } catch (e) {
      console.error('Mark attendance error:', e)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <div>
      <nav className="nav-header">
        <div className="container nav-content">
          <div className="nav-logo">EduTrack Attendance</div>
          <div className="nav-links">
            {user && (
              <>
                <a href="#" className="nav-link" onClick={() => setActiveTab('student')}>Students</a>
                <a href="#" className="nav-link" onClick={() => setActiveTab('staff')}>Staff</a>
                <a href="#" className="nav-link" onClick={() => setActiveTab('visitor')}>Visitors</a>
              </>
            )}
            <a href="#" className="nav-link" onClick={handleLogout}>Logout</a>
          </div>
        </div>
      </nav>

      {/* WiFi Status Banner */}
      <div style={{
        background: wifiStatus === 'connected' ? '#10b981' : wifiStatus === 'checking' ? '#f59e0b' : '#ef4444',
        color: 'white',
        padding: '0.5rem',
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        {wifiStatus === 'connected' && `✓ Connected to School WiFi: ${wifiSSID}`}
        {wifiStatus === 'checking' && '🔄 Checking WiFi connection...'}
        {wifiStatus === 'unavailable' && '⚠️ Please connect to school WiFi for attendance'}
      </div>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        {/* Login Section for Non-authenticated users */}
        {!user && (
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📸 Selfie Login & Attendance</h2>
            
            {attendanceMarked && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                ✓ Attendance marked successfully!
              </div>
            )}

            {/* Login Type Tabs */}
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              <button 
                className={`tab ${loginType === 'student' ? 'active' : ''}`}
                onClick={() => setLoginType('student')}
              >
                Student
              </button>
              <button 
                className={`tab ${loginType === 'staff' ? 'active' : ''}`}
                onClick={() => setLoginType('staff')}
              >
                Staff
              </button>
              <button 
                className={`tab ${loginType === 'nonstaff' ? 'active' : ''}`}
                onClick={() => setLoginType('nonstaff')}
              >
                Visitor
              </button>
            </div>

            {loginError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{loginError}</div>
            )}

            <form onSubmit={handleLogin}>
              {loginType === 'nonstaff' ? (
                <>
                  <div className="form-group">
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={visitorName}
                      onChange={e => setVisitorName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      value={visitorPhone}
                      onChange={e => setVisitorPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Organization/Company</label>
                    <input
                      type="text"
                      className="input"
                      value={visitorOrg}
                      onChange={e => setVisitorOrg(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Purpose of Visit *</label>
                    <input
                      type="text"
                      className="input"
                      value={visitorPurpose}
                      onChange={e => setVisitorPurpose(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
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
                      required
                    />
                  </div>
                </>
              )}

              {/* Selfie Capture */}
              <div className="form-group">
                <label className="label">📸 Take Selfie (Required)</label>
                {!selfieImage ? (
                  <div style={{ textAlign: 'center' }}>
                    {cameraOn ? (
                      <div>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          style={{ 
                            width: '100%', 
                            borderRadius: '0.5rem',
                            transform: 'scaleX(-1)'
                          }} 
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button type="button" className="btn btn-primary" onClick={takeSelfie}>
                            📸 Capture
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={stopCamera}>
 </button>
                        </div>
                                                 Cancel
                          </div>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={startCamera}>
                        📷 Open Camera
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={selfieImage} 
                      alt="Selfie" 
                      style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'cover',
                        borderRadius: '0.5rem',
                        transform: 'scaleX(-1)'
                      }} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => setSelfieImage('')}
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>

              {/* WiFi Info */}
              <div className="form-group">
                <div style={{ 
                  padding: '0.75rem', 
                  background: isWithinWifi ? '#d1fae5' : '#fef3c7',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <strong>WiFi:</strong> {wifiSSID || 'Not connected'} 
                  {isWithinWifi && <span style={{ color: '#065f46' }}> ✓ School WiFi verified</span>}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loggingIn || !selfieImage || (loginType !== 'nonstaff' && (!email || !password))}
              >
                {loggingIn ? 'Processing...' : `✓ ${loginType === 'nonstaff' ? 'Check In' : 'Login & Mark Attendance'}`}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Attendance is automatically marked when logging in from school WiFi
            </p>
          </div>
        )}

        {/* Attendance Dashboard for Authenticated Users */}
        {user && (
          <>
            {/* Statistics */}
            {statistics && (
              <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="card stat-card">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{statistics.total}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-label">Present</span>
                  <span className="stat-value" style={{ color: '#10b981' }}>{statistics.present}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-label">Absent</span>
                  <span className="stat-value" style={{ color: '#ef4444' }}>{statistics.absent}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-label">Present %</span>
                  <span className="stat-value">{statistics.presentPercentage}%</span>
                </div>
              </div>
            )}

            {/* Date Picker */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="label" style={{ margin: 0 }}>Date:</label>
              <input
                type="date"
                className="input"
                style={{ width: 'auto' }}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Attendance Table */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>
                {activeTab === 'student' && 'Student Attendance'}
                {activeTab === 'staff' && 'Staff Attendance'}
                {activeTab === 'visitor' && 'Visitor Log'}
              </h3>
              
              {loading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : attendance.length === 0 ? (
                <div className="empty-state">No records found</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      {activeTab === 'student' && <th>Student</th>}
                      {activeTab === 'staff' && <th>Staff</th>}
                      {activeTab === 'visitor' && <th>Visitor</th>}
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>WiFi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record: any) => (
                      <tr key={record.id}>
                        {activeTab === 'student' && (
                          <>
                            <td>{record.studentName}<br/><small>{record.class}</small></td>
                            {user.role === 'admin' && (
                              <td>
                                <select
                                  className="input"
                                  style={{ width: 'auto', padding: '0.25rem' }}
                                  value={record.status}
                                  onChange={e => markAttendance(record.studentId, e.target.value)}
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                  <option value="permission">Permission</option>
                                </select>
                              </td>
                            )}
                          </>
                        )}
                        {activeTab === 'staff' && (
                          <>
                            <td>{record.staffName}<br/><small>{record.role}</small></td>
                          </>
                        )}
                        {activeTab === 'visitor' && (
                          <>
                            <td>{record.fullName}<br/><small>{record.organization}</small></td>
                          </>
                        )}
                        <td>{record.checkInTime || '-'}</td>
                        <td>{record.checkOutTime || '-'}</td>
                        <td>
                          <span className={`badge ${
                            record.status === 'present' || record.status === 'checked-in' ? 'badge-success' :
                            record.status === 'absent' ? 'badge-danger' :
                            record.status === 'late' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.checkInWifi || record.checkOutWifi || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
