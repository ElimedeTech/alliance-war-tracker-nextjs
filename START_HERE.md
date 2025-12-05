# 🎮 Alliance War Tracker v2.0 - START HERE

Welcome to your upgraded Alliance War Tracker! This is a complete Next.js conversion with all the new features you requested.

## 📖 Documentation Guide

Choose your path based on what you need:

### 🚀 I Want to Deploy to Production (20 minutes)
**Read: [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐ START HERE
- Complete step-by-step walkthrough
- Firebase setup → Local testing → GitHub → Vercel
- Zero to live app with screenshots and troubleshooting

### ⚡ I Just Want to Test Locally (5 minutes)
**Read: [QUICKSTART.md](QUICKSTART.md)**
- Firebase setup in 2 minutes
- Install and run in 1 minute
- Start tracking immediately

### 📚 I Want Complete Documentation
**Read: [README.md](README.md)**
- Full feature list
- Detailed usage guide
- Troubleshooting
- Best practices

### 🆕 What's Different from v1.0?
**Read: [WHATS_NEW.md](WHATS_NEW.md)**
- New player management system
- New performance tracking
- Feature comparison table
- Migration guide

### 📦 Understanding the Project
**Read: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**
- Complete file structure
- Data model explanation
- Tech stack details
- Usage flows

### 🌐 Deploying to Production
**Read: [DEPLOYMENT.md](DEPLOYMENT.md)**
- Vercel deployment (free)
- Custom domain setup
- Security configuration
- Troubleshooting deployment

## ✅ New Features Implemented

All your requested features are complete:

### 1. Player Management ✅
- ✅ Add new players
- ✅ Remove players
- ✅ Assign players to specific BGs (10 per BG)
- ✅ Bulk assignment tools
- ✅ Unassign/reassign players

### 2. Player Performance Tracking ✅
- ✅ Number of path fights taken
- ✅ Number of mini boss (MB) fights taken
- ✅ Total node assignments (auto-calculated)
- ✅ Total deaths from nodes (auto-calculated)
- ✅ Average deaths per fight
- ✅ Performance dashboard with stats

### 3. Enhanced Integration ✅
- ✅ Players show in node assignment dropdowns
- ✅ BG-specific player filtering
- ✅ Real-time updates across all features
- ✅ Statistics modal with player data

## 🎯 Quick Reference

### First-Time Setup
```bash
# 1. Configure Firebase
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# 2. Install dependencies
npm install

# 3. Run the app
npm run dev

# 4. Open browser
http://localhost:3000
```

### Daily Usage
1. **Officers log in** → Enter alliance name + key
2. **Manage players** → Click "Players" button
3. **Track wars** → Select BG → Expand paths → Track nodes
4. **View stats** → Click "Stats" button
5. **Share with team** → Click "Share Link" button

### Player Management Workflow
1. Click "Players" in header
2. Add all 30 alliance members
3. Assign 10 players to each BG:
   - BG1: 10 players
   - BG2: 10 players
   - BG3: 10 players
4. Update performance metrics after each war:
   - Path fights taken
   - Mini boss fights taken
5. Check performance dashboard in Stats

## 📁 Project Structure Overview

```
alliance-war-tracker-nextjs/
│
├── 📘 Documentation (Start here!)
│   ├── START_HERE.md          ← You are here
│   ├── QUICKSTART.md          ← 5-minute setup
│   ├── README.md              ← Complete guide
│   ├── WHATS_NEW.md           ← v2.0 features
│   ├── PROJECT_SUMMARY.md     ← Deep dive
│   └── DEPLOYMENT.md          ← Going live
│
├── ⚙️ Configuration
│   ├── .env.local.example     ← Copy to .env.local
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── 💻 Application Code
│   ├── app/                   ← Next.js app directory
│   ├── components/            ← React components
│   ├── lib/                   ← Firebase config
│   └── types/                 ← TypeScript types
│
└── 🚫 Not Included (you'll generate)
    ├── node_modules/          ← Run npm install
    ├── .next/                 ← Build output
    └── .env.local             ← Your Firebase config
```

## 🎓 Learning Path

### New to Next.js?
1. Start with [QUICKSTART.md](QUICKSTART.md) - no Next.js knowledge needed!
2. Run the app and explore the features
3. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) to understand the structure
4. Check out Next.js docs when you want to customize: https://nextjs.org/docs

### Familiar with Next.js?
1. Check [WHATS_NEW.md](WHATS_NEW.md) for v2.0 changes
2. Review the component structure in [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
3. Look at `types/index.ts` for the data model
4. Dive into the code!

### Ready to Deploy?
1. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel setup
2. Takes about 10 minutes total
3. Get a free production URL
4. Share with your alliance!

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Realtime Database
- **State Management**: React Hooks
- **Deployment**: Vercel (recommended)

## 💡 Key Concepts

### Alliance Key System
- Unique key identifies your alliance
- All officers use the same key
- Embedded in share links
- Stored in Firebase path: `alliances/{key}/`

### Real-Time Sync
- Changes appear instantly for all officers
- Powered by Firebase Realtime Database
- No refresh needed
- Collaborative tracking

### Player Management
- Central roster of all members
- Assign 10 players per BG
- Track performance metrics
- Historical data across wars

### Performance Tracking
- Path fights = regular node clears
- MB fights = mini boss takedowns
- Auto-calculate deaths from nodes
- View comprehensive stats

## 🎯 Common Tasks

### Add a Player
```
Players → Enter name → Add Player
→ Assign to BG from dropdown
→ Done!
```

### Update Player Performance
```
Players → Find player in BG list
→ Update "Path Fights" number
→ Update "MB Fights" number
→ Changes save automatically
```

### Track a War
```
Select BG → Expand Path
→ Assign node to player
→ Click status: ○ → ◐ → ✓
→ Enter deaths
→ Attack bonus updates
```

### View Performance
```
Stats → Player Performance Tracker table
→ See all metrics
→ Sort by assignments/deaths
→ Identify top performers
```

## 🆘 Quick Troubleshooting

**Firebase connection error?**
→ Check `.env.local` has all 7 Firebase variables

**Players not showing?**
→ Add them via "Players" button first

**Data not syncing?**
→ All officers must use the exact same alliance key

**Build errors?**
→ Delete `node_modules` and `.next`, run `npm install` again

**Need help?**
→ Check the troubleshooting section in [README.md](README.md)

## 📞 Next Steps

### Right Now
1. ✅ Read [QUICKSTART.md](QUICKSTART.md)
2. ✅ Set up Firebase (2 minutes)
3. ✅ Run the app (`npm install && npm run dev`)
4. ✅ Add test players
5. ✅ Try tracking a war

### This Week
1. ✅ Add all 30 alliance members
2. ✅ Assign to battlegroups
3. ✅ Track your first real war
4. ✅ Share with 2-3 officers for testing
5. ✅ Deploy to Vercel

### Ongoing
1. ✅ Track all season wars
2. ✅ Update player performance after each war
3. ✅ Review stats for improvements
4. ✅ Plan assignments based on performance
5. ✅ Dominate the alliance war season! 🏆

## 🌟 Key Features At a Glance

| Feature | Status | File |
|---------|--------|------|
| Real-time sync | ✅ | All components |
| War tracking | ✅ | MainApp.tsx |
| BG management | ✅ | Battlegroup*.tsx |
| Path/Node tracking | ✅ | PathCard.tsx, NodeRow.tsx |
| **Player CRUD** | ✅ NEW | PlayerManagement.tsx |
| **BG assignment** | ✅ NEW | PlayerManagement.tsx |
| **Path fights** | ✅ NEW | PlayerManagement.tsx |
| **MB fights** | ✅ NEW | PlayerManagement.tsx |
| **Performance stats** | ✅ NEW | StatsModal.tsx |
| Attack bonus calc | ✅ | BattlegroupContent.tsx |
| Share links | ✅ | Header.tsx |
| Statistics | ✅ ENHANCED | StatsModal.tsx |

## 🎉 You're Ready!

Everything you need is here:
- ✅ Complete working application
- ✅ All requested features
- ✅ Comprehensive documentation
- ✅ Easy setup process
- ✅ Production-ready code

**Pick your starting point above and let's get your alliance tracking! 🚀**

---

**Quick links:**
- [⚡ 5-Minute Setup](QUICKSTART.md)
- [📖 Full Documentation](README.md)
- [🆕 What's New](WHATS_NEW.md)
- [🌐 Deploy Guide](DEPLOYMENT.md)
- [📦 Project Details](PROJECT_SUMMARY.md)
