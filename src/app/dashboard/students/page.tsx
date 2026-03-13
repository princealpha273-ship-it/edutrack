'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  admissionNumber: string
  class: string
  academicScore: number
  attendanceRate: number
  user: {
    fullName: string
    email: string
    phone: string
  }
}

interface Activity {
  id: string
  studentId: string
  activityName: string
  category: string
  participationLevel: string
  achievementNotes: string
  achievementLevel: string
}

export default function StudentManagementPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityForm, setActivityForm] = useState({
    activityName: '',
    category: 'academics',
    participationLevel: 'participant',
    achievementNotes: '',
    achievementLevel: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // Fetch students
      const studentsRes = await fetch('/api/students', { headers })
      const studentsData = await studentsRes.json()
      if (studentsData.success) {
        setStudents(studentsData.students)
      }
    } catch (e) {
      console.error('Failed to fetch:', e)
    }
    setLoading(false)
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent?.id,
          ...activityForm
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('Activity added successfully!')
        setShowActivityModal(false)
        setActivityForm({
          activityName: '',
          category: 'academics',
          participationLevel: 'participant',
          achievementNotes: '',
          achievementLevel: ''
        })
      }
    } catch (e) {
      console.error('Failed to add activity:', e)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const gradeOptions = [
    { label: 'Primary', options: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'] },
    { label: 'Secondary', options: ['Form 1','Form 2','Form 3','Form 4'] },
    { label: 'College/University', options: ['Year 1','Year 2','Year 3','Year 4','Semester 1','Semester 2','Semester 3','Semester 4','Unit 1','Unit 2','Unit 3','Unit 4'] }
  ]

  return (
    <div>
      <nav className="nav-header">
        <div className="container nav-content">
          <div className="nav-logo">EduTrack - Student Management</div>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="#" className="nav-link" onClick={handleLogout}>Logout</a>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="page-header">
          <h1 className="page-title">👨‍🎓 Student Management</h1>
          <p className="page-subtitle">Manage students, activities, grades and achievements</p>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Total Students: {students.length}</h3>
                <button className="btn btn-primary">+ Add Student</button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Student List</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Admission No.</th>
                    <th>Class/Grade</th>
                    <th>Score</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No students found</td>
                    </tr>
                  ) : students.map(student => (
                    <tr key={student.id}>
                      <td>{student.user?.fullName || 'N/A'}</td>
                      <td>{student.admissionNumber}</td>
                      <td>{student.class}</td>
                      <td>{student.academicScore}%</td>
                      <td>{student.attendanceRate}%</td>
                      <td>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => { setSelectedStudent(student); setShowActivityModal(true) }}
                        >
                          + Activity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Activity for {selectedStudent?.user?.fullName}</h2>
            </div>
            <form onSubmit={handleAddActivity}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Activity Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={activityForm.activityName}
                    onChange={e => setActivityForm({...activityForm, activityName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={activityForm.category}
                    onChange={e => setActivityForm({...activityForm, category: e.target.value})}
                  >
                    <option value="academics">Academics</option>
                    <option value="sports">Sports</option>
                    <option value="clubs">Clubs</option>
                    <option value="leadership">Leadership</option>
                    <option value="community">Community Service</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Participation Level</label>
                  <select
                    className="input"
                    value={activityForm.participationLevel}
                    onChange={e => setActivityForm({...activityForm, participationLevel: e.target.value})}
                  >
                    <option value="participant">Participant</option>
                    <option value="member">Member</option>
                    <option value="organizer">Organizer</option>
                    <option value="leader">Leader</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Achievement Level</label>
                  <select
                    className="input"
                    value={activityForm.achievementLevel}
                    onChange={e => setActivityForm({...activityForm, achievementLevel: e.target.value})}
                  >
                    <option value="">None</option>
                    <option value="participation">Participation Certificate</option>
                    <option value="merit">Merit</option>
                    <option value="winner">Winner</option>
                    <option value="champion">Champion</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={activityForm.achievementNotes}
                    onChange={e => setActivityForm({...activityForm, achievementNotes: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowActivityModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
