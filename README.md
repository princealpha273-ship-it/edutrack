# 🎓 EduTrack - Complete School Management System

A full-featured multi-tenant school management platform built with Next.js, featuring WiFi + Selfie attendance, e-portfolios, fee payments, and more.

---

## 🚀 Quick Start

### Option 1: Run immediately
```bash
cd C:\EduTrack
npm run dev
```
Then open **http://localhost:3000** in your browser

### Option 2: Use the batch file
```
Double-click start.bat in the EduTrack folder
```

---

## 📋 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@edutrack.com | password123 |
| School Admin | admin@mukiria.ac.ke | password123 |
| Teacher | teacher@mukiria.ac.ke | password123 |
| Student | student@mukiria.ac.ke | password123 |

---

## 🌐 App URLs

- **Main Site**: http://localhost:3000
- **Platform Admin**: http://localhost:3000/platform-login
- **Register School**: http://localhost:3000/register-institution
- **Attendance**: http://localhost:3000/attendance
- **Dashboard**: http://localhost:3000/dashboard (after login)
- **E-Portfolio**: http://localhost:3000/dashboard/portfolio
- **Hotspot Management**: http://localhost:3000/dashboard/hotspot

---

## ✨ Features

### 1. Multi-Tenant Architecture
- Unlimited schools on one platform
- Each school has isolated data
- Platform admin manages all institutions

### 2. WiFi + Selfie Attendance
- Mobile hotspot security (only ClassRep/Unit Teacher hotspots work)
- Selfie capture for verification
- Auto attendance marking
- Check-in & check-out tracking

### 3. Hotspot Security (Max 8 per school)
- Admin adds ClassReps or Unit Teachers
- Only their mobile hotspots work for attendance

### 4. Fee Payment System
- M-Pesa integration (STK Push)
- 100 KES commission per transaction
- Real-time balance tracking

### 5. E-Portfolio System
- Link external portfolio
- Built-in portfolio builder
- Shareable public links

### 6. Performance Tracking
- Subject grades
- Academic scores
- Extracurricular activities

### 7. Announcements
- Priority levels (normal, important, urgent)
- Target groups

### 8. Timetable
- Weekly class schedules

### 9. Offline Sync
- IndexedDB for offline data

---

## 💰 Revenue Model

| Source | Amount |
|--------|--------|
| Per Transaction Fee | 100 KES |
| Small School | 5,000 KES/month |
| Medium School | 10,000 KES/month |
| Large School | 25,000 KES/month |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Auth**: JWT
- **Payments**: M-Pesa Daraja API

---

## 📁 Project Structure

```
EduTrack/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Demo data
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # User dashboard
│   │   ├── attendance/        # Attendance portal
│   │   ├── platform-admin/    # Super admin
│   │   └── api/               # API routes
│   └── lib/                   # Utilities
├── package.json
├── start.bat              # Quick start
└── README.md
```

---

## 🔧 Troubleshooting

### If localhost:3000 doesn't work:
1. Make sure no other app is using port 3000
2. Try running: `npm run dev` again
3. Check firewall settings

### If npm install fails:
```bash
rm -rf node_modules
npm install
```

---

## 📞 Support

Built for Mukiria Secondary School and beyond. 🚀

**Version**: 1.0.0
**Last Updated**: March 2026
