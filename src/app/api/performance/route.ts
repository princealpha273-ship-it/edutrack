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

    const student = await prisma.student.findUnique({ where: { userId: auth.userId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const activities = await prisma.activity.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' }
    })

    const subjects = await prisma.subjectGrade.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    })

    const totalScore = subjects.reduce((sum, s) => sum + s.score, 0)
    const averageScore = subjects.length > 0 ? totalScore / subjects.length : 0

    const performanceData = {
      activities,
      subjects,
      summary: {
        totalActivities: activities.length,
        totalSubjects: subjects.length,
        averageScore: Math.round(averageScore * 10) / 10,
        academicScore: student.academicScore,
        attendanceRate: student.attendanceRate
      }
    }

    return NextResponse.json({ success: true, performance: performanceData })
  } catch (error: any) {
    console.error('Get performance error:', error)
    return NextResponse.json({ error: 'Failed to get performance data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdminOrTeacher = auth.role === 'admin' || auth.role === 'teacher'
    
    const body = await request.json()
    const { studentId, activityName, category, participationLevel, achievementNotes, achievementLevel, subject, term, year, score, grade } = body

    if (activityName) {
      const targetStudent = isAdminOrTeacher && studentId 
        ? await prisma.student.findUnique({ where: { id: studentId } })
        : await prisma.student.findUnique({ where: { userId: auth.userId } })
      
      if (!targetStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      const activity = await prisma.activity.create({
        data: {
          institutionId: targetStudent.institutionId,
          studentId: targetStudent.id,
          activityName,
          category: category || 'general',
          participationLevel: participationLevel || 'participant',
          achievementNotes,
          achievementLevel
        }
      })

      return NextResponse.json({ success: true, activity })
    }

    if (subject && isAdminOrTeacher) {
      const targetStudent = await prisma.student.findUnique({ where: { id: studentId } })
      if (!targetStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      const subjectGrade = await prisma.subjectGrade.create({
        data: {
          institutionId: targetStudent.institutionId,
          studentId: targetStudent.id,
          subject,
          term: term || 'Term 1',
          year: year || new Date().getFullYear(),
          score: score || 0,
          grade: grade || 'E'
        }
      })

      const student = await prisma.student.findUnique({ where: { id: targetStudent.id } })
      if (student) {
        const allGrades = await prisma.subjectGrade.findMany({ where: { studentId: targetStudent.id } })
        const avgScore = allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length
        await prisma.student.update({
          where: { id: targetStudent.id },
          data: { academicScore: avgScore }
        })
      }

      return NextResponse.json({ success: true, subjectGrade })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Create performance error:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}
