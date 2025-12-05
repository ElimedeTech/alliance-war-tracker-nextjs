# 🚀 Complete Deployment Walkthrough - Zero to Live App

**Total Time: 20-30 minutes**

This guide assumes you have:
- The alliance-war-tracker-nextjs folder
- A computer with internet access
- That's it!

---

## 📋 Table of Contents

1. [Install Required Tools](#step-1-install-required-tools) (5 min)
2. [Set Up Firebase](#step-2-set-up-firebase) (5 min)
3. [Configure Your App Locally](#step-3-configure-your-app-locally) (2 min)
4. [Test Locally](#step-4-test-locally) (3 min)
5. [Push to GitHub](#step-5-push-to-github) (5 min)
6. [Deploy to Vercel](#step-6-deploy-to-vercel) (5 min)
7. [Test Production & Share](#step-7-test-production--share) (2 min)

---

## Step 1: Install Required Tools

### 1.1 Install Node.js

**Check if you have it:**
```bash
node --version
```

If you see a version number (like `v18.x.x` or `v20.x.x`), **skip to Step 2!** ✅

**If not installed:**

**Windows:**
1. Go to https://nodejs.org/
2. Click the big green "LTS" button (recommended)
3. Download and run the installer
4. Click "Next" through everything (accept defaults)
5. Restart your terminal/command prompt
6. Verify: `node --version`

**Mac:**
1. Go to https://nodejs.org/
2. Click the big green "LTS" button
3. Download and run the `.pkg` installer
4. Follow the installation wizard
5. Open Terminal and verify: `node --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Verify
node --version
```

### 1.2 Install Git

**Check if you have it:**
```bash
git --version
```

If you see a version, **skip to Step 2!** ✅

**If not installed:**

**Windows:**
1. Go to https://git-scm.com/download/win
2. Download and install
3. Use default settings
4. Restart terminal

**Mac:**
```bash
# Git comes with Xcode Command Line Tools
xcode-select --install
```

**Linux:**
```bash
sudo apt install git
```

**Verify:**
```bash
git --version
```

---

## Step 2: Set Up Firebase

### 2.1 Create Firebase Account

1. **Go to:** https://console.firebase.google.com/
2. **Sign in** with your Google account (create one if needed)
3. **Accept terms** if prompted

### 2.2 Create a New Project

1. **Click:** "Add project" (or "Create a project")
2. **Enter project name:** `alliance-war-tracker` (or whatever you prefer)
3. **Click:** Continue
4. **Disable Google Analytics** (toggle OFF - you don't need it)
   - Or leave it on if you want analytics
5. **Click:** Create project
6. **Wait** ~30 seconds while it creates
7. **Click:** Continue

### 2.3 Enable Realtime Database

1. **In left sidebar**, click "Build" → "Realtime Database"
   - Or find it in the main project dashboard
2. **Click:** "Create Database"
3. **Choose location:** Select closest to you (e.g., `us-central1`)
4. **Security rules:** Select **"Start in test mode"**
   - ⚠️ This allows read/write without auth
   - ✅ Perfect for small trusted alliances
   - 🔒 You can secure it later
5. **Click:** Enable

**You should see:** Empty database with URL like:
```
https://alliance-war-tracker-abc123-default-rtdb.firebaseio.com/
```

### 2.4 Get Your Firebase Configuration

1. **Click the gear icon** ⚙️ (top left, next to "Project Overview")
2. **Click:** "Project settings"
3. **Scroll down** to "Your apps" section
4. **Click the web icon** `</>`
   - Looks like: `</>`
5. **Register app:**
   - App nickname: `Alliance War Tracker` (or anything)
   - ❌ DON'T check Firebase Hosting
   - Click "Register app"
6. **Copy the configuration:**

You'll see code like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "alliance-war-tracker-abc123.firebaseapp.com",
  databaseURL: "https://alliance-war-tracker-abc123-default-rtdb.firebaseio.com",
  projectId: "alliance-war-tracker-abc123",
  storageBucket: "alliance-war-tracker-abc123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**COPY THESE VALUES!** You'll need them in the next step.

**Keep this page open** or save these values in a text file temporarily.

7. **Click:** "Continue to console"

---

## Step 3: Configure Your App Locally

### 3.1 Open Your Project Folder

**Open terminal/command prompt** and navigate to your project:

```bash
# Example - adjust path to where you saved the project
cd ~/Downloads/alliance-war-tracker-nextjs

# Or on Windows
cd C:\Users\YourName\Downloads\alliance-war-tracker-nextjs
```

### 3.2 Create Environment File

**Copy the example file:**

```bash
# Mac/Linux
cp .env.local.example .env.local

# Windows (Command Prompt)
copy .env.local.example .env.local

# Windows (PowerShell)
Copy-Item .env.local.example .env.local
```

### 3.3 Edit Environment File

**Open `.env.local` in a text editor:**

- **Windows:** Right-click → Open with → Notepad
- **Mac:** Open with TextEdit
- **Or use:** VS Code, Sublime, any text editor

**Replace the placeholder values** with your Firebase config from Step 2.4:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alliance-war-tracker-abc123.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://alliance-war-tracker-abc123-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alliance-war-tracker-abc123
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alliance-war-tracker-abc123.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Important:**
- ✅ Use YOUR actual values from Firebase
- ❌ Don't add quotes around values
- ❌ Don't add spaces after `=`
- ✅ Each value on its own line

**Save the file** and close your editor.

### 3.4 Install Dependencies

**In your terminal** (still in the project folder):

```bash
npm install
```

**This will take 1-2 minutes** as it downloads all dependencies.

You'll see lots of output - this is normal! ✅

**When done, you should see:**
```
added 348 packages in 45s
```

---

## Step 4: Test Locally

### 4.1 Start Development Server

**In your terminal:**

```bash
npm run dev
```

**You should see:**
```
> alliance-war-tracker@2.0.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**🎉 Your app is running locally!**

### 4.2 Open in Browser

**Open your browser** and go to:
```
http://localhost:3000
```

**You should see:** The Alliance War Tracker login screen! 🎮

### 4.3 Quick Test

**Test that Firebase works:**

1. **Enter alliance name:** "Test Alliance"
2. **Click:** "Generate" button
3. **Click:** "Connect to Alliance Data"

**If it works:**
- ✅ You'll see the main app
- ✅ No errors in browser console (press F12 to check)
- ✅ Firebase connection successful!

**Test adding a player:**
1. Click "Players" button
2. Enter name: "Test Player"
3. Click "Add Player"
4. Should see success message ✅

**If everything works, you're ready to deploy!** 🚀

**Stop the server:**
- Press `Ctrl + C` in terminal

---

## Step 5: Push to GitHub

### 5.1 Create GitHub Account (if needed)

**If you don't have GitHub:**
1. Go to https://github.com/
2. Click "Sign up"
3. Follow the process (free account is fine)
4. Verify your email

**If you already have GitHub,** skip to 5.2 ✅

### 5.2 Create New Repository

1. **Go to:** https://github.com/new
2. **Repository name:** `alliance-war-tracker`
3. **Description:** (optional) "Marvel Contest of Champions Alliance War Tracker"
4. **Visibility:**
   - **Private** ← Recommended (only you see it)
   - OR Public (anyone can see, but that's okay)
5. **Important:** ❌ DO NOT check these:
   - ❌ Don't add README (we have one)
   - ❌ Don't add .gitignore (we have one)
   - ❌ Don't choose a license
6. **Click:** "Create repository"

### 5.3 Initialize Git Locally

**In your terminal** (in the project folder):

```bash
git init
```

**You should see:**
```
Initialized empty Git repository in /path/to/alliance-war-tracker-nextjs/.git/
```

### 5.4 Add All Files

```bash
git add .
```

**Check what's staged:**
```bash
git status
```

**You should see** lots of green files listed. ✅

### 5.5 Make First Commit

```bash
git commit -m "Initial commit - Alliance War Tracker v2.0"
```

**You should see:**
```
[main ...] Initial commit - Alliance War Tracker v2.0
 XX files changed, XXXX insertions(+)
```

### 5.6 Connect to GitHub

**GitHub will show you commands** on the "Create repository" page. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/alliance-war-tracker.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

**If prompted for credentials:**
- GitHub no longer accepts passwords!
- You need a **Personal Access Token**

**To create a token:**
1. Go to: https://github.com/settings/tokens
2. Click: "Generate new token" → "Generate new token (classic)"
3. Note: "Alliance Tracker"
4. Check: `repo` (full control)
5. Click: "Generate token"
6. **COPY THE TOKEN** (you can't see it again!)
7. Use this token as your password when pushing

**After successful push:**
```bash
Enumerating objects: XX, done.
...
To https://github.com/YOUR_USERNAME/alliance-war-tracker.git
 * [new branch]      main -> main
```

### 5.7 Verify on GitHub

**Go to your repository** on GitHub:
```
https://github.com/YOUR_USERNAME/alliance-war-tracker
```

**You should see** all your files! ✅

---

## Step 6: Deploy to Vercel

### 6.1 Create Vercel Account

1. **Go to:** https://vercel.com/signup
2. **Click:** "Continue with GitHub"
3. **Authorize** Vercel to access your GitHub
4. **Choose account type:** Hobby (free) is perfect

### 6.2 Import Your Project

1. **You'll land on the dashboard**
2. **Click:** "Add New..." → "Project"
3. **Find your repository:**
   - You should see `alliance-war-tracker` listed
   - If not, click "Adjust GitHub App Permissions" and grant access
4. **Click:** "Import" next to your repository

### 6.3 Configure Project

**You'll see configuration screen:**

**Framework Preset:** Next.js ✅ (auto-detected)
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build` (auto-filled)
**Output Directory:** `.next` (auto-filled)

**Don't click Deploy yet!** ⚠️

### 6.4 Add Environment Variables

**This is THE MOST IMPORTANT STEP!** 🔥

1. **Expand:** "Environment Variables" section
2. **For each variable**, add one at a time:

**Add these 7 variables:**

```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: [paste your Firebase API key]
```

```
Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: [paste your auth domain]
```

```
Name: NEXT_PUBLIC_FIREBASE_DATABASE_URL
Value: [paste your database URL - must include https://]
```

```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: [paste your project ID]
```

```
Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: [paste your storage bucket]
```

```
Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: [paste your sender ID]
```

```
Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: [paste your app ID]
```

**How to add each one:**
1. Type the variable **Name** (exactly as shown above)
2. Paste the **Value** from your Firebase config
3. Click "Add"
4. Repeat for all 7 variables

**Double-check:**
- ✅ All 7 variables added
- ✅ Names match exactly (including `NEXT_PUBLIC_`)
- ✅ Values copied correctly from Firebase
- ✅ No extra spaces or quotes

### 6.5 Deploy!

**Click:** "Deploy" button

**Now wait...** ⏳

**You'll see:**
```
Building...
○ Initializing...
○ Cloning repository...
○ Installing dependencies...
○ Building application...
```

**This takes 1-3 minutes.** Watch the logs if you're curious!

**When successful:**
```
✓ Build successful!
🎉 Congratulations!
```

### 6.6 Get Your URL

**You'll see a preview image** and a URL like:
```
https://alliance-war-tracker-abc123xyz.vercel.app
```

**Click:** "Continue to Dashboard"

---

## Step 7: Test Production & Share

### 7.1 Test Your Live App

**Click the "Visit" button** or open your Vercel URL in a new tab.

**You should see:** Your Alliance War Tracker login screen! 🎉

**Full test:**
1. ✅ Page loads
2. ✅ Enter alliance name
3. ✅ Generate key
4. ✅ Connect to alliance
5. ✅ Add a test player
6. ✅ Try tracking a node
7. ✅ Check that data saves

**Open in another browser/incognito:**
- Use the same alliance key
- Verify you see the same data
- This tests real-time sync! ✨

### 7.2 Get Your Shareable Link

**Your production URL is:**
```
https://your-project-name.vercel.app
```

**To find it:**
1. Go to Vercel dashboard
2. Click your project
3. Look for "Domains" section
4. Copy the `.vercel.app` URL

### 7.3 Share with Alliance Officers

**Two ways to share:**

**Option 1: Share Link with Key**
1. In your app, click "Share Link"
2. Copy the link (includes alliance key in URL)
3. Send to officers via Discord/WhatsApp/etc.
4. They just click and enter alliance name!

**Option 2: Share URL + Key Separately**
1. Share your Vercel URL
2. Share the alliance key separately
3. Officers enter both when connecting

### 7.4 Set Up Your Alliance

**First time setup:**
1. ✅ Create your alliance (generate key)
2. ✅ Add all 30 players
3. ✅ Assign 10 players to each BG
4. ✅ Create first war or use default War 1
5. ✅ Share link with officers

**Now you're tracking wars in production!** 🏆

---

## 🎯 Quick Reference Commands

**Local Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Test production build
npm run start        # Run production locally
```

**Git Commands:**
```bash
git status           # Check changes
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to GitHub
```

**URLs to Remember:**
- **Local app:** http://localhost:3000
- **GitHub repo:** https://github.com/YOUR_USERNAME/alliance-war-tracker
- **Vercel dashboard:** https://vercel.com/dashboard
- **Firebase console:** https://console.firebase.google.com/
- **Your live app:** https://your-project.vercel.app

---

## 🐛 Troubleshooting

### Build Failed on Vercel

**Check the build logs** in Vercel dashboard:

**Common issues:**

**1. Missing environment variables**
```
Error: Firebase configuration missing
```
**Fix:** Add all 7 environment variables in Vercel

**2. TypeScript errors**
```
Type error: ...
```
**Fix:** Check your local build with `npm run build`

**3. Node version mismatch**
**Fix:** Vercel uses Node 18 by default (should work)

### Firebase Connection Errors

**"Failed to connect"**
- ✅ Check all environment variables are correct
- ✅ Verify Database URL includes `https://`
- ✅ Make sure Realtime Database is enabled in Firebase
- ✅ Check database rules are set to "test mode"

### Can't Push to GitHub

**"Authentication failed"**
- Use a Personal Access Token, not password
- Generate at: https://github.com/settings/tokens
- Use token as password when prompted

**"Permission denied"**
- Check you own the repository
- Verify remote URL: `git remote -v`

### Local Server Won't Start

**"Port 3000 already in use"**
```bash
# Kill the process
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**"Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Environment Variables Not Working

**Local (`.env.local`):**
- ✅ File named exactly `.env.local` (note the dot!)
- ✅ In root of project folder
- ✅ No quotes around values
- ✅ Restart dev server after changes

**Vercel:**
- ✅ All 7 variables added
- ✅ Names include `NEXT_PUBLIC_`
- ✅ Redeploy after adding variables

---

## 🎉 Success Checklist

By now you should have:

- ✅ Firebase project created and configured
- ✅ Local app running and tested
- ✅ Code pushed to GitHub
- ✅ App deployed to Vercel
- ✅ Production app working
- ✅ Shareable link ready for officers
- ✅ Alliance created with test data

**You're ready to track alliance wars!** 🚀

---

## 📞 What's Next?

### Immediate (Today)
1. Share link with 1-2 officers for testing
2. Add all 30 alliance members
3. Assign players to battlegroups
4. Start tracking your current war

### This Week
1. Get all officers using it
2. Complete one full war tracking
3. Check player performance stats
4. Adjust workflow as needed

### Optional Improvements
1. Set up custom domain (see below)
2. Add Firebase Authentication
3. Secure database rules
4. Set up analytics

---

## 🌐 Bonus: Custom Domain Setup

Want `war.yourguild.com` instead of `your-app.vercel.app`?

### Quick Steps:
1. Buy a domain (GoDaddy, Namecheap, ~$10/year)
2. In Vercel project → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel shows you how)
5. Wait 5-60 minutes for DNS propagation
6. Done!

**Detailed guide:** Check Vercel docs at https://vercel.com/docs/custom-domains

---

## 🔄 Updating Your App

**To make changes:**
```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Description of changes"
git push

# 4. Vercel auto-deploys! 🎉
```

**Vercel automatically deploys** every time you push to GitHub!

---

## 💡 Tips for Success

1. **Keep your alliance key safe** - It's like a password
2. **Use the share link** - Easiest for officers
3. **Test with 2-3 officers first** before rolling out to all
4. **Back up data** - Export JSON from Firebase occasionally
5. **Check Firebase usage** - Stay within free tier limits
6. **Monitor Vercel deployments** - Check dashboard for issues

---

## 🏆 You Did It!

Your Alliance War Tracker is now:
- ✅ Running in production on Vercel
- ✅ Connected to Firebase for real-time data
- ✅ Accessible from anywhere
- ✅ Shareable with your alliance
- ✅ Costing you $0/month

**Congratulations!** 🎉

Now go dominate those alliance wars! 💪

---

**Questions or issues?** Review the troubleshooting section or check the other documentation files (README.md, QUICKSTART.md, etc.)

**Good luck, and happy tracking!** 🎮⚔️
