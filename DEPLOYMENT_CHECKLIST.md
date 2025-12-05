# ⚡ Deployment Checklist - Quick Reference

Use this as a checklist alongside the [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)

---

## 📝 Pre-Flight Checklist

Before you start, make sure you have:
- [ ] Computer with internet access
- [ ] Google account (for Firebase)
- [ ] GitHub account (or create one)
- [ ] The `alliance-war-tracker-nextjs` folder
- [ ] 20-30 minutes of time

---

## 🎯 Deployment Flow

```
1. Install Tools (5 min)
   ↓
2. Set Up Firebase (5 min)
   ↓
3. Configure Locally (2 min)
   ↓
4. Test Locally (3 min)
   ↓
5. Push to GitHub (5 min)
   ↓
6. Deploy to Vercel (5 min)
   ↓
7. Test & Share (2 min)
   ↓
🎉 DONE!
```

---

## ✅ Step-by-Step Checklist

### 1️⃣ Install Tools (Skip if already have)

- [ ] Install Node.js from https://nodejs.org/
- [ ] Install Git from https://git-scm.com/
- [ ] Verify: `node --version` works
- [ ] Verify: `git --version` works

**Time: 5 min** | **Skip to Step 2 if already installed** ✅

---

### 2️⃣ Set Up Firebase

- [ ] Go to https://console.firebase.google.com/
- [ ] Sign in with Google
- [ ] Click "Add project"
- [ ] Name it (e.g., "alliance-war-tracker")
- [ ] Disable Google Analytics
- [ ] Click "Create project"
- [ ] Enable Realtime Database (Build → Realtime Database)
- [ ] Choose "test mode" for security rules
- [ ] Get Firebase config (⚙️ → Project settings → Your apps → Web)
- [ ] Copy all 7 config values

**Time: 5 min** | **Keep config values handy!** 📋

---

### 3️⃣ Configure Locally

**Open terminal in project folder:**

- [ ] Copy env file: `cp .env.local.example .env.local`
- [ ] Edit `.env.local` with Firebase values
- [ ] Add all 7 Firebase variables
- [ ] Save the file
- [ ] Run: `npm install`
- [ ] Wait for installation to complete

**Time: 2 min** | **All 7 env variables must be set!** ⚠️

---

### 4️⃣ Test Locally

- [ ] Run: `npm run dev`
- [ ] Open: http://localhost:3000
- [ ] See login screen ✅
- [ ] Generate alliance key
- [ ] Connect to alliance
- [ ] Add a test player
- [ ] Verify Firebase connection works
- [ ] Stop server: `Ctrl + C`

**Time: 3 min** | **If this works, you're ready to deploy!** 🚀

---

### 5️⃣ Push to GitHub

**Create repository:**
- [ ] Go to https://github.com/new
- [ ] Name: `alliance-war-tracker`
- [ ] Visibility: Private (recommended)
- [ ] DON'T add README or .gitignore
- [ ] Click "Create repository"

**Push code:**
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit"`
- [ ] Run: `git remote add origin https://github.com/YOUR_USERNAME/alliance-war-tracker.git`
- [ ] Run: `git branch -M main`
- [ ] Run: `git push -u origin main`
- [ ] Verify code appears on GitHub

**Time: 5 min** | **Replace YOUR_USERNAME with your actual GitHub username!** 

---

### 6️⃣ Deploy to Vercel

**Connect account:**
- [ ] Go to https://vercel.com/signup
- [ ] Click "Continue with GitHub"
- [ ] Authorize Vercel

**Import project:**
- [ ] Click "Add New..." → "Project"
- [ ] Find `alliance-war-tracker`
- [ ] Click "Import"

**Configure:**
- [ ] Framework: Next.js (auto-detected) ✅
- [ ] Expand "Environment Variables"
- [ ] Add all 7 Firebase variables (NEXT_PUBLIC_...)
- [ ] Double-check all values are correct
- [ ] Click "Deploy"
- [ ] Wait 1-3 minutes for build
- [ ] See success message 🎉

**Time: 5 min** | **CRITICAL: Add all 7 environment variables!** 🔥

---

### 7️⃣ Test Production & Share

**Test your live app:**
- [ ] Click "Visit" or open Vercel URL
- [ ] See login screen
- [ ] Generate alliance key
- [ ] Connect to alliance
- [ ] Add test player
- [ ] Verify everything works
- [ ] Open in incognito/another browser
- [ ] Use same key - verify sync works

**Share with alliance:**
- [ ] Copy Vercel URL (e.g., `your-app.vercel.app`)
- [ ] Or use "Share Link" button in app (includes key)
- [ ] Send to officers via Discord/WhatsApp
- [ ] Officers click link and connect

**Time: 2 min** | **You're live!** ✨

---

## 🔍 Quick Troubleshooting

### Build Failed on Vercel
➡️ Check that all 7 environment variables are added correctly

### Firebase Connection Error
➡️ Verify Database URL includes `https://`
➡️ Check Realtime Database is enabled

### Can't Push to GitHub
➡️ Use Personal Access Token instead of password
➡️ Generate at: https://github.com/settings/tokens

### Local Server Won't Start
➡️ Delete `node_modules` folder
➡️ Run `npm install` again

---

## 📊 Environment Variables Reference

**You need ALL 7 of these:**

```
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✅ NEXT_PUBLIC_FIREBASE_DATABASE_URL
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✅ NEXT_PUBLIC_FIREBASE_APP_ID
```

**Add in 2 places:**
1. Local: `.env.local` file
2. Vercel: Project settings → Environment Variables

---

## 🎯 Success Criteria

You know it's working when:

- ✅ Local app loads at localhost:3000
- ✅ Can connect to alliance
- ✅ Can add players
- ✅ Firebase data saves
- ✅ Production app loads at Vercel URL
- ✅ Real-time sync works between browsers
- ✅ Officers can connect with shared link

---

## 📱 After Deployment

**Immediate tasks:**
1. Share link with 1-2 officers for testing
2. Add all 30 alliance members
3. Assign players to BGs
4. Start tracking first war

**First week:**
1. Get all officers using it
2. Complete one full war
3. Check performance stats
4. Refine workflow

---

## 🔄 Making Updates

**After initial deployment:**

```bash
# Make your changes
# Test locally
npm run dev

# Commit and push
git add .
git commit -m "Your changes"
git push

# Vercel auto-deploys! ✨
```

No need to redeploy manually - it's automatic!

---

## 💰 Cost Breakdown

**Firebase (Free Tier):**
- 1GB storage ✅
- 100 simultaneous connections ✅
- 10GB data transfer/month ✅

**Vercel (Free Tier):**
- Unlimited personal projects ✅
- 100GB bandwidth/month ✅
- Automatic HTTPS ✅

**Total: $0/month** 🎉

---

## 📞 Need Help?

**For detailed instructions:**
→ Read [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)

**For local setup only:**
→ Read [QUICKSTART.md](QUICKSTART.md)

**For full feature list:**
→ Read [README.md](README.md)

**For what's new:**
→ Read [WHATS_NEW.md](WHATS_NEW.md)

---

## 🎉 Final Check

Before sharing with your alliance:

- [ ] Production app loads
- [ ] Can create alliance
- [ ] Can add players
- [ ] Can assign to BGs
- [ ] Can track nodes
- [ ] Attack bonus calculates
- [ ] Stats modal works
- [ ] Share link works
- [ ] Real-time sync tested

**All checked?** You're ready to go! 🚀

---

## ⏱️ Time Estimates

| Step | Time | Can Skip? |
|------|------|-----------|
| Install Tools | 5 min | If already have |
| Firebase Setup | 5 min | No |
| Local Config | 2 min | No |
| Local Testing | 3 min | Recommended |
| GitHub Push | 5 min | No |
| Vercel Deploy | 5 min | No |
| Testing | 2 min | No |
| **Total** | **20-30 min** | |

---

**Print this page and check off items as you go!** ✅

**Good luck with your deployment!** 🎮⚔️
