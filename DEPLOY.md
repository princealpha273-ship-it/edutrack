# 🚀 EduTrack Deployment Guide

This guide will help you deploy EduTrack to Vercel with a free PostgreSQL database.

---

## Step 1: Get a Free PostgreSQL Database

1. Go to **https://neon.tech** (free, no credit card)
2. Sign up with GitHub
3. Click **"Create a project"**
   - Name: `edutrack`
4. Wait for it to create, then copy the **Connection String** (looks like: `postgresql://user:pass@host.neon.tech/db?sslmode=require`)
5. **Keep this URL safe** - you'll need it later

---

## Step 2: Push Code to GitHub

1. Go to **https://github.com** and create a new repository named `edutrack`
2. Run these commands in your EduTrack folder:

```bash
cd C:\EduTrack
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edutrack.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy to Vercel

1. Go to **https://vercel.com** and sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find your `edutrack` repository and click **"Import"**
4. In the **"Environment Variables"** section, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | The Neon connection string you copied (starts with `postgresql://...`) |
| `JWT_SECRET` | Any random string (e.g., `edutrack-secret-123`) |
| `MPESA_CONSUMER_KEY` | Leave empty or your M-Pesa key |
| `MPESA_CONSUMER_SECRET` | Leave empty or your M-Pesa secret |
| `MPESA_SHORTCODE` | `174379` |
| `MPESA_PASSKEY` | Leave empty or your M-Pesa passkey |
| `MPESA_CALLBACK_URL` | `https://your-app.vercel.app/api/mpesa/callback` |
| `MPESA_ENV` | `sandbox` |

5. Click **"Deploy"**

---

## Step 4: Seed the Database

After deployment completes:

1. Go to your Vercel project dashboard
2. Click **"Storage"** → **"Connect Database"** (if prompted)
3. Go to **"Deployments"** tab
4. Click the latest deployment → **"Logs"**
5. In the dropdown, select **"Shell"** (or use Vercel CLI)
6. Run:
```bash
npx prisma db push
```
7. Then run:
```bash
node prisma/seed.js
```

---

## Step 5: Access Your App

1. Vercel will give you a URL like `edutrack-xxxxx.vercel.app`
2. Open it and test with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@edutrack.com | password123 |
| School Admin | admin@mukiria.ac.ke | password123 |
| Teacher | teacher@mukiria.ac.ke | password123 |
| Student | student@mukiria.ac.ke | password123 |

---

## ⚠️ Important Notes

- **DATABASE_URL** must include `?sslmode=require` at the end
- If seeding fails, check the Neon connection string is correct
- The app uses PostgreSQL now (not SQLite) for Vercel compatibility
