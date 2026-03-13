const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with multi-tenant architecture...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Platform Admin
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@edutrack.com' },
    update: {},
    create: {
      email: 'admin@edutrack.com',
      password: hashedPassword,
      fullName: 'Platform Administrator'
    }
  })
  console.log('Platform Admin created:', platformAdmin.email)

  // Create first Institution (Demo School)
  const institution = await prisma.institution.upsert({
    where: { slug: 'mukiria-secondary' },
    update: {},
    create: {
      name: 'Mukiria Secondary School',
      slug: 'mukiria-secondary',
      type: 'secondary',
      country: 'Kenya',
      county: 'Kirinyaga',
      phone: '254700000000',
      email: 'info@mukiria.ac.ke',
      subscriptionStatus: 'active',
      subscriptionPlan: 'premium',
      monthlyFee: 10000,
      defaultFeeAmount: 7000,
      commissionPerTransaction: 100
    }
  })
  console.log('Institution created:', institution.name)

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mukiria.ac.ke' },
    update: {},
    create: {
      email: 'admin@mukiria.ac.ke',
      password: hashedPassword,
      fullName: 'John Principal',
      phone: '254700000001'
    }
  })

  await prisma.institutionUser.create({
    data: {
      institutionId: institution.id,
      userId: adminUser.id,
      role: 'admin'
    }
  })

  await prisma.admin.create({
    data: {
      institutionId: institution.id,
      userId: adminUser.id,
      title: 'Principal'
    }
  })
  console.log('Admin user created:', adminUser.email)

  // Create Teacher User
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@mukiria.ac.ke' },
    update: {},
    create: {
      email: 'teacher@mukiria.ac.ke',
      password: hashedPassword,
      fullName: 'Mary Teacher',
      phone: '254700000002'
    }
  })

  await prisma.institutionUser.create({
    data: {
      institutionId: institution.id,
      userId: teacherUser.id,
      role: 'teacher'
    }
  })

  await prisma.teacher.create({
    data: {
      institutionId: institution.id,
      userId: teacherUser.id,
      subject: 'Mathematics'
    }
  })
  console.log('Teacher user created:', teacherUser.email)

  // Create Student User
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@mukiria.ac.ke' },
    update: {},
    create: {
      email: 'student@mukiria.ac.ke',
      password: hashedPassword,
      fullName: 'Alex Student',
      phone: '254700000003'
    }
  })

  await prisma.institutionUser.create({
    data: {
      institutionId: institution.id,
      userId: studentUser.id,
      role: 'student'
    }
  })

  const student = await prisma.student.create({
    data: {
      institutionId: institution.id,
      userId: studentUser.id,
      admissionNumber: 'EDU2024001',
      class: 'Form 2',
      parentPhone: '254700000004',
      academicScore: 78.5,
      attendanceRate: 92
    }
  })
  console.log('Student created:', student.admissionNumber)

  // Add subjects
  const subjects = [
    { subject: 'Mathematics', score: 75, grade: 'B' },
    { subject: 'English', score: 82, grade: 'A' },
    { subject: 'Science', score: 70, grade: 'B' },
    { subject: 'History', score: 88, grade: 'A' },
    { subject: 'Geography', score: 78, grade: 'B' }
  ]

  for (const sub of subjects) {
    await prisma.subjectGrade.create({
      data: {
        institutionId: institution.id,
        studentId: student.id,
        subject: sub.subject,
        term: 'Term 1',
        year: 2024,
        score: sub.score,
        grade: sub.grade
      }
    })
  }

  // Add activities
  const activities = [
    { name: 'Science Club', category: 'academics', level: 'member', note: 'Regular participant' },
    { name: 'Football Team', category: 'sports', level: 'player', note: 'School team player', achievement: 'merit' },
    { name: 'Debate Club', category: 'clubs', level: 'member', note: 'Active participant' }
  ]

  for (const act of activities) {
    await prisma.activity.create({
      data: {
        institutionId: institution.id,
        studentId: student.id,
        activityName: act.name,
        category: act.category,
        participationLevel: act.level,
        achievementNotes: act.note,
        achievementLevel: act.achievement
      }
    })
  }

  // Add fee transactions
  await prisma.feeTransaction.create({
    data: {
      institutionId: institution.id,
      userId: studentUser.id,
      studentId: student.id,
      schoolFeeAmount: 7000,
      commissionFee: 100,
      amountPaid: 7100,
      balanceRemaining: 0,
      paymentStatus: 'completed',
      paymentDate: new Date('2024-01-15')
    }
  })

  await prisma.feeTransaction.create({
    data: {
      institutionId: institution.id,
      userId: studentUser.id,
      studentId: student.id,
      schoolFeeAmount: 7000,
      commissionFee: 100,
      amountPaid: 7100,
      balanceRemaining: 0,
      paymentStatus: 'completed',
      paymentDate: new Date('2024-02-20')
    }
  })

  // Add announcements
  await prisma.announcement.create({
    data: {
      institutionId: institution.id,
      adminId: adminUser.id,
      title: 'Term 2 Exams Schedule',
      message: 'The term 2 examinations will commence from Monday, 15th April.',
      targetRole: 'student',
      priority: 'important'
    }
  })

  await prisma.announcement.create({
    data: {
      institutionId: institution.id,
      adminId: adminUser.id,
      title: 'School Fees Reminder',
      message: 'School fees for Term 2 are due by 5th April.',
      targetRole: 'all',
      priority: 'normal'
    }
  })

  await prisma.announcement.create({
    data: {
      institutionId: institution.id,
      adminId: adminUser.id,
      title: 'URGENT: Library Closure',
      message: 'The school library will be closed for renovations from 1st April to 5th April.',
      targetRole: 'student',
      priority: 'urgent'
    }
  })

  // Add school WiFi
  await prisma.schoolWifi.create({
    data: {
      id: 'mukiria-wifi',
      institutionId: institution.id,
      ssid: 'Mukiria-School-WiFi',
      bssid: '00:11:22:33:44:55',
      isActive: true
    }
  })

  // Add attendance records
  const today = new Date().toISOString().split('T')[0]

  await prisma.studentAttendance.create({
    data: {
      institutionId: institution.id,
      studentId: student.id,
      date: today,
      checkInTime: '07:45:00',
      checkInWifi: 'Mukiria-School-WiFi',
      checkInVerified: true,
      status: 'present'
    }
  })

  await prisma.staffAttendance.create({
    data: {
      institutionId: institution.id,
      userId: teacherUser.id,
      role: 'teacher',
      date: today,
      checkInTime: '07:30:00',
      checkInWifi: 'Mukiria-School-WiFi',
      checkInVerified: true,
      status: 'present'
    }
  })

  // Add visitor
  await prisma.nonStaffAttendance.create({
    data: {
      institutionId: institution.id,
      fullName: 'James Parent',
      phone: '254700000999',
      organization: 'Parents Association',
      purpose: 'Meeting with Principal',
      date: today,
      checkInTime: '09:00:00',
      checkInWifi: 'Mukiria-School-WiFi',
      status: 'checked-in'
    }
  })

  // Add sample hotspot admin
  await prisma.hotspotAdmin.create({
    data: {
      institutionId: institution.id,
      fullName: 'John ClassRep',
      phone: '254700000010',
      role: 'classrep',
      unit: 'Form 2',
      hotspotName: 'Form 2A Hotspot',
      isActive: true
    }
  })

  // Create second institution (Demo College)
  await prisma.institution.upsert({
    where: { slug: 'mukiria-college' },
    update: {},
    create: {
      name: 'Mukiria Technical College',
      slug: 'mukiria-college',
      type: 'college',
      country: 'Kenya',
      county: 'Kirinyaga',
      subscriptionStatus: 'trial',
      subscriptionPlan: 'basic',
      defaultFeeAmount: 15000,
      commissionPerTransaction: 100
    }
  })
  console.log('College created: Mukiria Technical College')

  console.log('\n✅ Database seeded successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('PLATFORM ADMIN:')
  console.log('  Email: admin@edutrack.com')
  console.log('  Password: password123')
  console.log('  URL: /platform-login')
  console.log('')
  console.log('SCHOOL ADMIN:')
  console.log('  Email: admin@mukiria.ac.ke')
  console.log('  Password: password123')
  console.log('')
  console.log('TEACHER:')
  console.log('  Email: teacher@mukiria.ac.ke')
  console.log('  Password: password123')
  console.log('')
  console.log('STUDENT:')
  console.log('  Email: student@mukiria.ac.ke')
  console.log('  Password: password123')
  console.log('  Admission: EDU2024001')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
