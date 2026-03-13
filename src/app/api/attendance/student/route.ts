import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    const { searchParams } = new URL(request.url)
    
    const date = searchParams.get('date')

    let where: any = {}
    if (date) where.date = date

    const attendance = await prisma.studentAttendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { checkInTime: 'desc' }]
    })

    return NextResponse.json({
      success: true,
      attendance,
      statistics: {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        presentPercentage: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0
      }
    })
  } catch (error: any) {
    console.error('Get student attendance error:', error)
    return NextResponse.json({ error: 'Failed to get attendance' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, date, status, remarks, checkOut, selfieImage, wifiSSID } = body

    const now = new Date()
    const dateStr = date || now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 8)

    // Students can check out
    if (checkOut && studentId) {
      const existing = await prisma.studentAttendance.findUnique({
        where: { studentId_date: { studentId, date: dateStr } }
      })

      if (existing) {
        const updated = await prisma.studentAttendance.update({
          where: { id: existing.id },
          data: { checkOutTime: timeStr, checkOutWifi: wifiSSID, checkOutImage: selfieImage, checkOutVerified: true }
        })
        return NextResponse.json({ success: true, attendance: updated })
      }
    }

    // Teachers/Admins can mark attendance
    if (studentId && status && (auth.role === 'admin' || auth.role === 'teacher')) {
      const created = await prisma.studentAttendance.create({
        data: { institutionId: auth.institutionId || '', studentId, date: dateStr, checkInTime: timeStr, checkInWifi: wifiSSID, checkInImage: selfieImage, checkInVerified: true, status, remarks }
      })
      return NextResponse.json({ success: true, attendance: created })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Mark student attendance error:', error)
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}
