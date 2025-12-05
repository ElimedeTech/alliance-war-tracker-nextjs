# Quick Start Guide - Alliance War Tracker

## 🚀 Get Up and Running in 5 Minutes!

### Step 1: Firebase Setup (2 minutes)
1. Go to https://console.firebase.google.com/
2. Click "Add project" → Give it a name → Continue
3. Disable Google Analytics (unless you want it) → Create project
4. Once created, click "Realtime Database" in the left menu
5. Click "Create Database"
6. Choose a location (closest to you)
7. Start in "test mode" → Enable

### Step 2: Get Firebase Credentials (1 minute)
1. Click the gear icon ⚙️ → Project settings
2. Scroll to "Your apps" → Click the web icon (</>)
3. Give it a nickname (e.g., "War Tracker") → Register app
4. Copy all the values from the `firebaseConfig` object

### Step 3: Configure Your App (1 minute)
1. In the project folder, copy `.env.local.example` to `.env.local`
2. Open `.env.local` and paste your Firebase values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=paste_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paste_here
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=paste_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=paste_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paste_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=paste_here
   NEXT_PUBLIC_FIREBASE_APP_ID=paste_here
   ```

### Step 4: Install and Run (1 minute)
```bash
npm install
npm run dev
```

Open http://localhost:3000 and you're ready! 🎉

## 🎮 First Use

1. **Create Your Alliance**:
   - Enter alliance name (e.g., "Elite Warriors")
   - Optionally add tag (e.g., "[EW]")
   - Click "Generate" → "Connect to Alliance Data"

2. **Add Players**:
   - Click "Players" button in header
   - Add your 30 alliance members
   - Assign 10 players to each BG (BG1, BG2, BG3)

3. **Start Tracking Wars**:
   - The first war is already created
   - Select BG1, expand paths, start tracking!
   - Assign nodes to players, update status, track deaths

4. **Share with Officers**:
   - Click "Share Link" in header
   - Send to your alliance officers
   - Everyone sees the same live data!

## 💡 Key Features to Try

### Player Performance Tracking
- Go to "Players" → Update "Path Fights" and "MB Fights" for each player
- Click "Stats" to see detailed performance metrics
- Track who's carrying the alliance! 💪

### Attack Bonus
- Automatically calculated: 240 - (deaths × 3)
- Updates in real-time as you track deaths
- Click "Recalculate" if needed

### Node Tracking
- Click status button to cycle: ○ → ◐ → ✓
- Assign players from dropdown
- Track deaths per node
- Add notes for important info

### War Management
- Click "New War" when season war starts
- Switch between wars with dropdown
- View historical data anytime

## 🔧 Troubleshooting

**Can't connect to Firebase?**
- Double-check all values in `.env.local`
- Make sure database URL includes `https://`
- Verify Realtime Database is enabled

**Officers can't see data?**
- Make sure they're using the EXACT same alliance key
- Use the "Share Link" button - the key is in the URL!
- All officers must enter the same alliance name

**Data not saving?**
- Check browser console for errors (F12)
- Verify internet connection
- Make sure Firebase database rules allow writes

## 📱 Mobile Tip
The app is fully responsive! Officers can track on phones during wars.

---

Need help? Check the full README.md for detailed documentation!
