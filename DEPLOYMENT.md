# Deploying to Vercel - Step by Step

## 🌐 Deploy Your Alliance War Tracker to the Web

Vercel offers **free hosting** for Next.js apps - perfect for your alliance tracker!

## Prerequisites
- GitHub account (free)
- Vercel account (free) - sign up at https://vercel.com
- Your Firebase credentials ready

## Step 1: Push to GitHub (5 minutes)

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it `alliance-war-tracker` (or whatever you prefer)
   - Make it Private (recommended) or Public
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Push your code**:
   ```bash
   cd alliance-war-tracker-nextjs
   git init
   git add .
   git commit -m "Initial commit - Alliance War Tracker v2.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/alliance-war-tracker.git
   git push -u origin main
   ```

## Step 2: Connect to Vercel (3 minutes)

1. **Sign up/Login to Vercel**:
   - Go to https://vercel.com
   - Click "Sign Up" (or "Login")
   - Choose "Continue with GitHub"
   - Authorize Vercel

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Find your `alliance-war-tracker` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

## Step 3: Add Environment Variables (2 minutes)

**IMPORTANT**: Your Firebase credentials go here!

1. **Expand "Environment Variables" section**

2. **Add each variable** (one at a time):
   ```
   Name: NEXT_PUBLIC_FIREBASE_API_KEY
   Value: [paste your Firebase API key]
   
   Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   Value: [paste your auth domain]
   
   Name: NEXT_PUBLIC_FIREBASE_DATABASE_URL
   Value: [paste your database URL]
   
   Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
   Value: [paste your project ID]
   
   Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   Value: [paste your storage bucket]
   
   Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   Value: [paste your sender ID]
   
   Name: NEXT_PUBLIC_FIREBASE_APP_ID
   Value: [paste your app ID]
   ```

3. **Click "Deploy"**

## Step 4: Wait for Deployment (1-2 minutes)

- Vercel will build your app
- Watch the build logs if you're curious
- When done, you'll see: "🎉 Congratulations!"

## Step 5: Access Your App

You'll get a URL like: `https://alliance-war-tracker-abc123.vercel.app`

**Share this URL with your alliance officers!**

## Custom Domain (Optional)

Want a custom domain like `war.yourguild.com`?

1. Buy a domain (GoDaddy, Namecheap, etc.)
2. In Vercel project settings → Domains
3. Add your domain
4. Update your domain's DNS records (Vercel shows you how)
5. Wait for DNS propagation (5-60 minutes)

## Updating Your Deployment

Every time you push to GitHub, Vercel auto-deploys!

```bash
# Make changes to your code
git add .
git commit -m "Added new feature"
git push

# Vercel automatically deploys the update!
```

## Environment-Specific URLs

Vercel gives you:
- **Production**: `yourapPp.vercel.app` (main branch)
- **Preview**: Unique URL for each pull request
- **Development**: Your local `localhost:3000`

## Monitoring & Analytics

In your Vercel dashboard:
- View deployment history
- Check build logs
- See real-time analytics
- Monitor performance

## Troubleshooting

### Build Failed?
- Check the build logs in Vercel
- Common issues:
  - TypeScript errors → Fix in your code
  - Missing dependencies → Check `package.json`
  - Environment variables → Verify they're all set

### Can't Connect to Firebase?
- Double-check all environment variables in Vercel
- Make sure Firebase Realtime Database is enabled
- Verify database rules allow read/write

### App Deployed But Not Working?
- Open browser console (F12) for errors
- Check Vercel logs for runtime errors
- Verify Firebase credentials are correct

## Security Tips

### Production Firebase Rules
Update your Firebase rules for production:

```json
{
  "rules": {
    "alliances": {
      "$allianceKey": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For better security (after adding auth):
```json
{
  "rules": {
    "alliances": {
      "$allianceKey": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### Environment Variables
- Never commit `.env.local` to GitHub
- Always use Vercel's environment variables feature
- Keep your Firebase credentials secure

## Cost

**FREE TIER INCLUDES**:
- Unlimited personal projects
- SSL/HTTPS included
- 100 GB bandwidth per month
- Automatic CI/CD
- Preview deployments

Perfect for an alliance app! You won't hit limits.

## Alternative Deployment Options

### Netlify
Similar to Vercel, also free:
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Self-Hosted
If you have a server:
```bash
npm run build
npm run start
```
Run on port 3000, use nginx/Apache as reverse proxy.

---

**Need help? The Vercel docs are excellent: https://vercel.com/docs**

Happy deploying! 🚀
