# 🚀 Vercel Deployment Guide - ALEXMONHART Frontend

## 📊 Current Status

### ✅ Connected to Vercel
- **Project:** sales-agent-frontend
- **Project ID:** prj_nniWQgJjeBZFUPFqex94NbgTwKPb
- **GitHub:** https://github.com/ghettosymph0/sales-agent-frontend

### ⚠️ Issue
Your frontend has **uncommitted changes** that aren't deployed to Vercel yet:
- Modified: `app/campaigns/page.tsx` (Send button changes)

**Vercel only deploys code that's pushed to GitHub!**

---

## 🔧 Fix: Deploy Your Changes to Vercel

### Step 1: Commit and Push Changes

```bash
cd ~/Projects/sales-agent-frontend

# Stage the changes
git add app/campaigns/page.tsx

# Commit with a clear message
git commit -m "feat: add Send Email button to campaign cards for easy sending"

# Push to GitHub
git push origin master
```

### Step 2: Vercel Auto-Deploys

Once you push to GitHub:
1. ✅ Vercel detects the push
2. ✅ Starts building automatically
3. ✅ Deploys to production (usually 2-3 minutes)

---

## 🌐 Find Your Vercel URL

### Option 1: Check Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Find project: **sales-agent-frontend**
3. Click on it
4. See your deployment URL (usually `sales-agent-frontend-xxx.vercel.app`)

### Option 2: Use Vercel CLI

```bash
cd ~/Projects/sales-agent-frontend
npx vercel --prod
```

This will show you the production URL.

---

## 📋 Common Issues & Solutions

### Issue 1: "Build Failed" on Vercel

**Cause:** TypeScript errors or missing dependencies

**Solution:**
```bash
# Test build locally first
cd ~/Projects/sales-agent-frontend
npm run build

# Fix any errors shown
# Then commit and push again
```

### Issue 2: "Environment Variables Missing"

**Cause:** Frontend needs `NEXT_PUBLIC_API_URL`

**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add:
   ```
   NEXT_PUBLIC_API_URL=https://web-production-0891b.up.railway.app
   ```
4. Redeploy

### Issue 3: "Not Deploying Automatically"

**Cause:** GitHub integration disconnected

**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Git
3. Reconnect GitHub repository
4. Enable auto-deploy on push

### Issue 4: "Blank Page" or "Cannot Connect to API"

**Cause:** Backend URL not configured or Railway backend is down

**Solution:**
1. Check `.env.local` has correct backend URL:
   ```
   NEXT_PUBLIC_API_URL=https://web-production-0891b.up.railway.app
   ```
2. Test backend is running:
   ```bash
   curl https://web-production-0891b.up.railway.app/
   ```
3. Add same URL to Vercel environment variables

---

## ✅ Complete Deployment Checklist

### Local Development
- [x] Frontend code updated (Send button added)
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Local build tested (`npm run build`)

### Vercel Configuration
- [ ] Environment variable `NEXT_PUBLIC_API_URL` set
- [ ] GitHub integration connected
- [ ] Auto-deploy enabled
- [ ] Production URL accessible

### Backend (Railway)
- [x] Backend running at Railway
- [ ] SMTP email configured (port 587)
- [ ] Environment variables updated
- [ ] API endpoints working

---

## 🚀 Quick Deploy Commands

```bash
# 1. Commit changes
cd ~/Projects/sales-agent-frontend
git add .
git commit -m "feat: add Send Email button and update attachment links"
git push origin master

# 2. Watch deployment
# Go to: https://vercel.com/dashboard
# Or use CLI:
npx vercel --prod

# 3. Test deployment
# Visit your Vercel URL
# Check campaigns page works
# Test send button
```

---

## 🌐 Production URLs

### Frontend (Vercel)
**To find your URL:**
1. Go to https://vercel.com/dashboard
2. Click on "sales-agent-frontend"
3. Copy the "Domains" URL

**Or check via CLI:**
```bash
cd ~/Projects/sales-agent-frontend
npx vercel ls
```

### Backend (Railway)
**Current URL:** https://web-production-0891b.up.railway.app

**Test it:**
```bash
curl https://web-production-0891b.up.railway.app/
```

---

## 📊 Deployment Flow

```
Your Code Changes
    ↓
Git Commit & Push
    ↓
GitHub Repository
    ↓
Vercel Auto-Detects Push
    ↓
Vercel Builds Frontend
    ↓
Vercel Deploys to Production
    ↓
Your Live URL Updated! 🎉
```

---

## 🔍 Debug: Check Vercel Build Logs

If deployment fails:

1. **Go to Vercel Dashboard**
2. **Click on your project**
3. **Click "Deployments" tab**
4. **Click on the failed deployment**
5. **Read the build logs** to see errors

Common errors:
- TypeScript errors → Fix types in code
- Missing dependencies → Run `npm install`
- Environment variables → Add to Vercel settings

---

## ⚙️ Environment Variables Setup

### Required for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://web-production-0891b.up.railway.app

# (Optional) Analytics
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

**Important:** Variables starting with `NEXT_PUBLIC_` are exposed to the browser!

---

## 🧪 Test Your Deployment

After deploying:

1. **Open your Vercel URL**
   - Example: `https://sales-agent-frontend-xxx.vercel.app`

2. **Test key features:**
   - ✅ Dashboard loads
   - ✅ Campaigns page shows campaigns
   - ✅ "Send Email" button appears
   - ✅ Settings page shows email config
   - ✅ Can click through all pages

3. **Test API connection:**
   - Open browser console (F12)
   - Check for API errors
   - Test sending an email

---

## 📱 Mobile & Production

### Custom Domain (Optional)

If you have a custom domain:

1. **Go to Vercel Dashboard**
2. **Project Settings → Domains**
3. **Add domain** (e.g., app.alexmonhart.com)
4. **Follow DNS setup instructions**
5. **Wait for SSL certificate** (automatic)

### Performance

Vercel automatically provides:
- ✅ Global CDN
- ✅ SSL/HTTPS
- ✅ Auto-scaling
- ✅ Fast builds
- ✅ Preview deployments for each commit

---

## 🆘 Still Not Working?

### Check These:

1. **GitHub push successful?**
   ```bash
   cd ~/Projects/sales-agent-frontend
   git status
   git log -1
   ```

2. **Vercel building?**
   - Go to https://vercel.com/dashboard
   - Check "Deployments" tab
   - Look for yellow "Building..." or green "Ready"

3. **Backend online?**
   ```bash
   curl https://web-production-0891b.up.railway.app/api/settings/email
   ```

4. **Environment variables set?**
   - Vercel Dashboard → Settings → Environment Variables
   - Should see `NEXT_PUBLIC_API_URL`

---

## 🎯 Quick Commands Reference

```bash
# Deploy to Vercel (push to GitHub)
cd ~/Projects/sales-agent-frontend
git add .
git commit -m "your message"
git push origin master

# Test build locally
npm run build

# Run dev server locally
npm run dev

# Check Vercel deployments
npx vercel ls

# Deploy directly via CLI (alternative)
npx vercel --prod
```

---

## ✅ Summary

**To get your frontend running on Vercel:**

1. ✅ Commit your changes
2. ✅ Push to GitHub
3. ✅ Vercel auto-deploys (2-3 min)
4. ✅ Check Vercel dashboard for URL
5. ✅ Test your deployment

**That's it!**

---

**Need Help?**
- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Project Settings: Check environment variables
