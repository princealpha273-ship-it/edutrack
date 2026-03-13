import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    const auth = token ? verifyToken(token) : null
    
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.role !== 'admin' && auth.role !== 'teacher') {
      return NextResponse.json({ error: 'Admin or Teacher access required' }, { status: 403 })
    }

    const students = await prisma.student.findMany({
      where: { institutionId: auth.institutionId },
      include: {
        user: { select: { fullName: true, email: true, phone: true } }
      },
      orderBy: { admissionNumber: 'asc' }
    })

    return NextResponse.json({ success: true, students })
  } catch (error: any) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Failed to get students' }, { status: 500 })
  }
}
