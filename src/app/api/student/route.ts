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

    const student = await prisma.student.findUnique({
      where: { userId: auth.userId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true, profilePhoto: true }
        },
        activities: { orderBy: { date: 'desc' } },
        subjects: { orderBy: { createdAt: 'desc' } },
        feeTransactions: { orderBy: { paymentDate: 'desc' } }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalPaid = student.feeTransactions
      .filter(t => t.paymentStatus === 'completed')
      .reduce((sum, t) => sum + t.amountPaid, 0)

    const totalCommission = student.feeTransactions
      .filter(t => t.paymentStatus === 'completed')
      .reduce((sum, t) => sum + t.commissionFee, 0)

    const subjectScores = student.subjects.map(s => ({
      subject: s.subject,
      score: s.score,
      grade: s.grade
    }))

    const activities = student.activities.map(a => ({
      id: a.id,
      name: a.activityName,
      category: a.category,
      level: a.participationLevel,
      achievement: a.achievementLevel,
      notes: a.achievementNotes,
      date: a.date
    }))

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        class: student.class,
        academicScore: student.academicScore,
        attendanceRate: student.attendanceRate,
        portfolioData: student.portfolioData,
        profile: student.user,
        subjects: subjectScores,
        activities,
        feeStatus: {
          totalPaid,
          totalCommission,
          transactions: student.feeTransactions.length
        }
      }
    })
  } catch (error: any) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Failed to get student data' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { portfolioData, class: studentClass } = body

    const student = await prisma.student.findUnique({ where: { userId: auth.userId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(portfolioData && { portfolioData }),
        ...(studentClass && { class: studentClass })
      }
    })

    return NextResponse.json({ success: true, student: updated })
  } catch (error: any) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}
