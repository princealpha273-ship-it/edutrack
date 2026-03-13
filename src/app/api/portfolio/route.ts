import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  return verifyToken(token)
}

// GET - Get eportfolio
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const shareableLink = searchParams.get('link')

    // If viewing by shareable link
    if (shareableLink) {
      const portfolio = await prisma.ePortfolio.findFirst({
        where: { shareableLink, isPublic: true },
        include: {
          student: {
            include: {
              user: { select: { fullName: true } }
            }
          }
        }
      })

      if (!portfolio) {
        return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, portfolio, isPublic: true })
    }

    // Get student's own portfolio
    let where: any = {}
    
    if (auth.role === 'student') {
      const student = await prisma.student.findFirst({
        where: { userId: auth.userId, institutionId: auth.institutionId }
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    const portfolio = await prisma.ePortfolio.findFirst({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true } }
          }
        }
      }
    })

    return NextResponse.json({ success: true, portfolio })
  } catch (error: any) {
    console.error('Get portfolio error:', error)
    return NextResponse.json({ error: 'Failed to get portfolio' }, { status: 500 })
  }
}

// POST - Create/update eportfolio
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only students can create their own portfolio
    if (auth.role !== 'student') {
      return NextResponse.json({ error: 'Only students can manage portfolios' }, { status: 403 })
    }

    const student = await prisma.student.findFirst({
      where: { userId: auth.userId, institutionId: auth.institutionId }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      portfolioUrl, bio, aboutMe, interests, skills, achievements, 
      certifications, projects, clubs, sports, leadership, volunteer,
      references, linkedIn, twitter, github, website, isPublic 
    } = body

    // Check if portfolio exists
    const existing = await prisma.ePortfolio.findFirst({
      where: { studentId: student.id }
    })

    const shareableLink = existing?.shareableLink || uuidv4().substring(0, 8)

    let portfolio
    if (existing) {
      portfolio = await prisma.ePortfolio.update({
        where: { id: existing.id },
        data: {
          portfolioUrl,
          bio,
          aboutMe,
          interests,
          skills,
          achievements: achievements ? JSON.stringify(achievements) : undefined,
          certifications: certifications ? JSON.stringify(certifications) : undefined,
          projects: projects ? JSON.stringify(projects) : undefined,
          clubs: clubs ? JSON.stringify(clubs) : undefined,
          sports: sports ? JSON.stringify(sports) : undefined,
          leadership: leadership ? JSON.stringify(leadership) : undefined,
          volunteer: volunteer ? JSON.stringify(volunteer) : undefined,
          references: references ? JSON.stringify(references) : undefined,
          linkedIn,
          twitter,
          github,
          website,
          isPublic,
          shareableLink
        }
      })
    } else {
      portfolio = await prisma.ePortfolio.create({
        data: {
          institutionId: auth.institutionId,
          studentId: student.id,
          portfolioUrl,
          bio,
          aboutMe,
          interests,
          skills,
          achievements: achievements ? JSON.stringify(achievements) : undefined,
          certifications: certifications ? JSON.stringify(certifications) : undefined,
          projects: projects ? JSON.stringify(projects) : undefined,
          clubs: clubs ? JSON.stringify(clubs) : undefined,
          sports: sports ? JSON.stringify(sports) : undefined,
          leadership: leadership ? JSON.stringify(leadership) : undefined,
          volunteer: volunteer ? JSON.stringify(volunteer) : undefined,
          references: references ? JSON.stringify(references) : undefined,
          linkedIn,
          twitter,
          github,
          website,
          isPublic,
          shareableLink
        }
      })
    }

    // Also update student's portfolioData
    await prisma.student.update({
      where: { id: student.id },
      data: { portfolioData: JSON.stringify({ portfolioUrl, shareableLink }) }
    })

    return NextResponse.json({ success: true, portfolio, shareableLink })
  } catch (error: any) {
    console.error('Save portfolio error:', error)
    return NextResponse.json({ error: 'Failed to save portfolio' }, { status: 500 })
  }
}

// Generate shareable link
export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findFirst({
      where: { userId: auth.userId, institutionId: auth.institutionId }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const portfolio = await prisma.ePortfolio.findFirst({
      where: { studentId: student.id }
    })

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const newLink = uuidv4().substring(0, 8)
    
    await prisma.ePortfolio.update({
      where: { id: portfolio.id },
      data: { shareableLink: newLink }
    })

    return NextResponse.json({ success: true, shareableLink: newLink })
  } catch (error: any) {
    console.error('Generate link error:', error)
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
  }
}
