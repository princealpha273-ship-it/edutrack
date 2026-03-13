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
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = auth.role === 'student' 
      ? await prisma.student.findUnique({ where: { userId: auth.userId } })
      : null

    const where = student ? { studentId: student.id } : {}

    const timetable = await prisma.timetableEntry.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { timeSlot: 'asc' }]
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const timeSlots = ['8:00-9:00', '9:00-10:00', '10:00-10:30', '10:30-11:30', '11:30-12:30', '12:30-1:30', '1:30-2:30', '2:30-3:30']

    const timetableByDay = days.map(day => ({
      day,
      slots: timeSlots.map(slot => {
        const entry = timetable.find(t => t.dayOfWeek === day && t.timeSlot === slot)
        return entry ? { subject: entry.subject, room: entry.room } : null
      })
    }))

    return NextResponse.json({ success: true, timetable: timetableByDay })
  } catch (error: any) {
    console.error('Get timetable error:', error)
    return NextResponse.json({ error: 'Failed to get timetable' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || (auth.role !== 'admin' && auth.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized - Admin/Teacher only' }, { status: 401 })
    }

    const body = await request.json()
    const { dayOfWeek, timeSlot, subject, room, studentId } = body

    const teacher = auth.role === 'teacher' 
      ? await prisma.teacher.findFirst({ where: { userId: auth.userId } })
      : null

    const institutionId = teacher?.institutionId || auth.institutionId

    if (!institutionId) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 400 })
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        institutionId,
        studentId: studentId || undefined,
        teacherId: teacher?.id,
        dayOfWeek,
        timeSlot,
        subject,
        room
      }
    })

    return NextResponse.json({ success: true, entry })
  } catch (error: any) {
    console.error('Create timetable error:', error)
    return NextResponse.json({ error: 'Failed to create timetable entry' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.timetableEntry.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
  } catch (error: any) {
    console.error('Delete timetable error:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
