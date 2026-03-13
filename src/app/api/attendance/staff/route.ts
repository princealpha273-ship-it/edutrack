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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const role = searchParams.get('role')

    let where: any = {}

    if (auth?.role !== 'admin') {
      where.userId = auth?.userId
    }

    if (date) where.date = date
    if (startDate && endDate) where.date = { gte: startDate, lte: endDate }
    if (role) where.role = role

    const attendance = await prisma.staffAttendance.findMany({
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
        presentPercentage: attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0
      }
    })
  } catch (error: any) {
    console.error('Get staff attendance error:', error)
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
    const { userId, date, status, remarks, checkOut, selfieImage, wifiSSID } = body

    const now = new Date()
    const dateStr = date || now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 8)

    if (!userId && auth.role !== 'admin') {
      // Self check-in or check-out
      const existing = await prisma.staffAttendance.findUnique({
        where: { userId_date: { userId: auth.userId, date: dateStr } }
      })

      if (existing && checkOut) {
        const updated = await prisma.staffAttendance.update({
          where: { id: existing.id },
          data: { checkOutTime: timeStr, checkOutWifi: wifiSSID, checkOutImage: selfieImage, checkOutVerified: true }
        })
        return NextResponse.json({ success: true, attendance: updated, action: 'check-out' })
      } else if (!existing) {
        const role = auth.role === 'admin' ? 'admin' : 'teacher'
        const created = await prisma.staffAttendance.create({
          data: { institutionId: auth.institutionId || '', userId: auth.userId, role, date: dateStr, checkInTime: timeStr, checkInWifi: wifiSSID, checkInImage: selfieImage, checkInVerified: true, status: 'present' }
        })
        return NextResponse.json({ success: true, attendance: created, action: 'check-in' })
      }
    }

    // Admin marks attendance
    if (userId && status && auth.role === 'admin') {
      const role = 'teacher'
        const created = await prisma.staffAttendance.create({
          data: { institutionId: auth.institutionId || '', userId, role, date: dateStr, status, remarks }
        })
      return NextResponse.json({ success: true, attendance: created })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Staff attendance error:', error)
    return NextResponse.json({ error: 'Failed to process attendance' }, { status: 500 })
  }
}
