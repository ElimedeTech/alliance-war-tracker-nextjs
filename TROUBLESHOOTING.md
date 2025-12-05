# 🔧 Troubleshooting Guide - Common Issues & Solutions

Quick fixes for common problems during deployment and usage.

---

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Firebase Issues](#firebase-issues)
- [Local Development Issues](#local-development-issues)
- [GitHub Issues](#github-issues)
- [Vercel Deployment Issues](#vercel-deployment-issues)
- [Production Issues](#production-issues)
- [Data & Sync Issues](#data--sync-issues)

---

## Installation Issues

### ❌ "npm: command not found"

**Problem:** Node.js not installed or not in PATH

**Solution:**
```bash
# Check if Node is installed
node --version

# If not, install from https://nodejs.org/
# Then restart your terminal
```

**Windows specific:**
- Restart Command Prompt/PowerShell after installing
- May need to add to PATH manually

---

### ❌ "npm install" fails with permission errors

**Problem:** Insufficient permissions

**Solution (Mac/Linux):**
```bash
# Don't use sudo! Instead, fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Solution (Windows):**
- Run Command Prompt as Administrator
- Or change npm cache location:
```cmd
npm config set cache C:\npm-cache --global
```

---

### ❌ "EACCES" or "EPERM" errors during install

**Problem:** File permission issues

**Solution:**
```bash
# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Firebase Issues

### ❌ "Failed to connect to Firebase"

**Problem:** Invalid configuration or database not enabled

**Checklist:**
- [ ] Realtime Database is enabled in Firebase Console
- [ ] Database rules are set to "test mode"
- [ ] All 7 environment variables are set
- [ ] Database URL includes `https://`
- [ ] Database URL ends with `.firebaseio.com` (not `.firebaseapp.com`)

**Verify your config:**
```bash
# Check your .env.local file
cat .env.local

# Make sure DATABASE_URL looks like:
# https://your-project-default-rtdb.firebaseio.com
```

---

### ❌ "Permission denied" when writing to database

**Problem:** Database rules too restrictive

**Solution:**
1. Go to Firebase Console
2. Realtime Database → Rules tab
3. Set to test mode (temporarily):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Click "Publish"

**Note:** This allows anyone to read/write. Secure it later with authentication.

---

### ❌ "Database URL is invalid"

**Problem:** Wrong URL format

**Common mistakes:**
```
❌ https://your-project.firebaseapp.com
❌ your-project-default-rtdb.firebaseio.com
❌ https://your-project.firebaseio.com (missing -default-rtdb)

✅ https://your-project-default-rtdb.firebaseio.com
```

**Find correct URL:**
1. Firebase Console → Realtime Database
2. Look at top of page - URL is shown there
3. Copy entire URL including `https://`

---

### ❌ Firebase credentials showing as "undefined"

**Problem:** Environment variables not loading

**Check:**
```bash
# Variable names must start with NEXT_PUBLIC_
# File must be named .env.local (note the dot!)
# No quotes around values
# No spaces after =

# Correct format:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXX
```

**Fix:**
1. Verify file is named `.env.local` (not `env.local` or `.env`)
2. Check variables start with `NEXT_PUBLIC_`
3. Restart dev server: `Ctrl+C` then `npm run dev`

---

## Local Development Issues

### ❌ "Port 3000 is already in use"

**Problem:** Another process using port 3000

**Solution (Mac/Linux):**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

**Solution (Windows):**
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

---

### ❌ "Cannot find module" errors

**Problem:** Dependencies not installed properly

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### ❌ Changes not showing in browser

**Problem:** Browser cache or build cache

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear Next.js cache:
```bash
rm -rf .next
npm run dev
```
3. Disable browser cache (F12 → Network tab → Disable cache)

---

### ❌ TypeScript errors during build

**Problem:** Type checking failures

**Solution:**
```bash
# Check types
npm run build

# If there are type errors, fix them in the code
# Or temporarily disable strict checking (not recommended):
# Edit tsconfig.json → set "strict": false
```

---

## GitHub Issues

### ❌ "Authentication failed" when pushing

**Problem:** GitHub no longer accepts passwords

**Solution:**
1. Create Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "Alliance Tracker"
   - Check scope: `repo` (full control)
   - Click "Generate token"
   - **COPY THE TOKEN** (you can't see it again!)
2. When prompted for password, paste the token
3. Save credentials (optional):
```bash
git config --global credential.helper store
```

---

### ❌ "Permission denied (publickey)"

**Problem:** SSH keys not set up

**Solution:**
Use HTTPS instead of SSH:
```bash
# Check your remote URL
git remote -v

# If it's SSH (git@github.com), change to HTTPS:
git remote set-url origin https://github.com/YOUR_USERNAME/alliance-war-tracker.git
```

---

### ❌ "fatal: not a git repository"

**Problem:** Git not initialized

**Solution:**
```bash
# Initialize git
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/alliance-war-tracker.git

# Continue with commit and push
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

### ❌ "Updates were rejected"

**Problem:** Remote has changes you don't have locally

**Solution:**
```bash
# Pull first, then push
git pull origin main --rebase
git push
```

---

## Vercel Deployment Issues

### ❌ Build fails on Vercel

**Check build logs** in Vercel dashboard for exact error.

**Common causes:**

**1. Missing environment variables**
```
Error: process.env.NEXT_PUBLIC_FIREBASE_API_KEY is undefined
```
**Fix:** Add all 7 Firebase variables in Vercel project settings

**2. TypeScript errors**
```
Type error: Property 'X' does not exist...
```
**Fix:** Test build locally first: `npm run build`

**3. Node version mismatch**
**Fix:** Vercel uses Node 18 by default (should work)
If needed, add to `package.json`:
```json
"engines": {
  "node": "18.x"
}
```

---

### ❌ Environment variables not working on Vercel

**Problem:** Variables not set or not accessed correctly

**Checklist:**
- [ ] All 7 variables added in Vercel
- [ ] Variable names include `NEXT_PUBLIC_` prefix
- [ ] No quotes around values
- [ ] Values copied correctly (check for typos)
- [ ] Redeployed after adding variables

**To redeploy:**
1. Vercel dashboard → Your project
2. Deployments tab
3. Click "..." → "Redeploy"

---

### ❌ "This deployment failed to build"

**Solution:**
1. Check build logs for specific error
2. Try building locally: `npm run build`
3. Fix any errors
4. Push to GitHub
5. Vercel will auto-deploy

---

### ❌ Deployment succeeds but app shows errors

**Problem:** Runtime errors or config issues

**Check:**
1. Browser console (F12) for errors
2. Vercel deployment logs
3. Firebase connection
4. Environment variables

---

## Production Issues

### ❌ "Failed to fetch" or network errors

**Problem:** CORS, Firebase rules, or network issues

**Check:**
1. Firebase Database rules allow read/write
2. Database URL is correct in Vercel env variables
3. Browser network tab (F12) for failed requests

**Verify database rules:**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### ❌ App loads but data doesn't save

**Problem:** Write permissions or connection issue

**Debug:**
1. Open browser console (F12)
2. Look for Firebase errors
3. Check Network tab for failed requests

**Common fixes:**
- Verify Firebase Database rules
- Check environment variables
- Verify Database URL format

---

### ❌ Slow loading times

**Problem:** Firebase region, network, or build size

**Solutions:**
1. Choose Firebase region closest to users
2. Check Vercel deployment region
3. Optimize images and assets
4. Check for console errors

---

## Data & Sync Issues

### ❌ Officers can't see my data

**Problem:** Using different alliance keys

**Solution:**
- Everyone must use the **EXACT same alliance key**
- Use "Share Link" button - it embeds the key in URL
- Or share key manually (copy/paste)

**Verify:**
1. Check alliance key in both browsers
2. Look at Firebase Console → Realtime Database
3. Data should be under `alliances/{your-key}/`

---

### ❌ Changes not syncing in real-time

**Problem:** Firebase listener not working

**Debug:**
```javascript
// Check browser console for:
// "Firebase connection established" ✅
// "Firebase sync error" ❌
```

**Solutions:**
1. Check internet connection
2. Verify Firebase Database is enabled
3. Check browser console for errors
4. Refresh the page

---

### ❌ Players not showing in dropdowns

**Problem:** Players not added or BG assignment issue

**Solution:**
1. Click "Players" button
2. Verify players are added
3. Check they're assigned to correct BG
4. Refresh the page if needed

---

### ❌ Data disappeared or was reset

**Problem:** Accidental deletion or wrong key

**Check:**
1. Using correct alliance key?
2. Check Firebase Console → Realtime Database
3. Look for your data under `alliances/{key}/`

**Prevent:**
- Backup data regularly (Firebase → Export JSON)
- Don't share alliance key publicly
- Consider adding authentication

---

## Browser-Specific Issues

### ❌ Works in Chrome but not Safari

**Problem:** Browser compatibility

**Solution:**
- Clear Safari cache
- Check Safari console for errors
- Try in Private Browsing mode
- Update Safari to latest version

---

### ❌ Mobile browser issues

**Problem:** Mobile-specific layout or functionality

**Solutions:**
1. Test responsive design
2. Check mobile browser console (use remote debugging)
3. Verify touch events work
4. Test on actual device, not just emulator

---

## Database & Performance Issues

### ❌ "Quota exceeded" from Firebase

**Problem:** Exceeded free tier limits

**Check usage:**
1. Firebase Console → Usage tab
2. See database usage, connections, bandwidth

**Free tier limits:**
- 1GB storage
- 100 simultaneous connections
- 10GB bandwidth/month

**Solutions:**
- For typical alliance: should never hit limits
- If you do, upgrade to Blaze plan (pay-as-you-go)

---

### ❌ "Too many requests" error

**Problem:** Rate limiting

**Solution:**
- Optimize queries (don't fetch entire database)
- Implement caching
- Reduce update frequency
- Usually not an issue for this app

---

## Development Workflow Issues

### ❌ Changes not reflecting after git push

**Problem:** Vercel not auto-deploying

**Check:**
1. Vercel dashboard → Deployments
2. Look for recent deployment
3. Check if there's a build error

**Fix:**
1. Verify GitHub integration is active
2. Manually trigger deployment in Vercel
3. Check Vercel settings → Git integration

---

### ❌ Want to test before deploying

**Solution:**
```bash
# Build production version locally
npm run build

# Start production server
npm run start

# Test at http://localhost:3000
```

---

## Emergency Fixes

### 🚨 Everything is broken - start fresh

**Nuclear option:**

```bash
# 1. Clean everything
rm -rf node_modules .next package-lock.json

# 2. Reinstall
npm install

# 3. Rebuild
npm run build

# 4. Test
npm run dev
```

---

### 🚨 Need to recover data

**If you have Firebase access:**
1. Firebase Console → Realtime Database
2. Click "⋮" → Export JSON
3. Save backup
4. To restore: Import JSON

---

### 🚨 Need to start over with Vercel

**Complete reset:**
1. Delete project in Vercel dashboard
2. Re-import from GitHub
3. Add environment variables again
4. Deploy

---

## Getting Help

### Check Logs

**Local:**
- Terminal output
- Browser console (F12)

**Vercel:**
- Deployment logs
- Function logs
- Runtime logs

**Firebase:**
- Firebase Console → Usage
- Database tab → Security rules

---

### Useful Commands

```bash
# Check versions
node --version
npm --version
git --version

# Clean slate
rm -rf node_modules package-lock.json .next
npm install

# Test build
npm run build

# Check git status
git status
git log --oneline

# Check environment
printenv | grep FIREBASE
```

---

## 📞 Still Stuck?

1. **Read the detailed guide:** [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)
2. **Check the checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. **Review main docs:** [README.md](README.md)

---

## 💡 Prevention Tips

**To avoid issues:**
- ✅ Always test locally before pushing
- ✅ Keep environment variables in sync (local + Vercel)
- ✅ Commit regularly with clear messages
- ✅ Backup Firebase data occasionally
- ✅ Monitor Firebase and Vercel usage
- ✅ Keep dependencies updated
- ✅ Test in multiple browsers

---

**Most issues are fixable in under 5 minutes with the solutions above!** 🔧

**Good luck!** 🚀
