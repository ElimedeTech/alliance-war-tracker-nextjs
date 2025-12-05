# Alliance War Tracker - Next.js

A modern, real-time collaboration tool for Marvel Contest of Champions Alliance War tracking, built with Next.js, TypeScript, and Firebase.

## ✨ Features

### Core Functionality
- **Real-time Collaboration**: Multiple officers can work together with live Firebase sync
- **3 Battlegroups**: Track all three BGs simultaneously
- **9 Paths per BG**: Complete path and node tracking
- **Boss Tracking**: Monitor final boss progress and deaths
- **Attack Bonus Calculator**: Automatic calculation based on deaths (240 - deaths × 3)
- **War Management**: Create, switch between, and delete multiple wars

### New Features (v2.0)
- **Player Management System**:
  - Add new players to the alliance
  - Remove players from the alliance
  - Assign players to specific Battlegroups (10 players per BG)
  - Bulk assignment of unassigned players
  
- **Player Performance Tracker**:
  - Track number of path fights taken per player
  - Track number of mini boss (MB) fights taken per player
  - Calculate total assignments across all wars
  - Calculate total deaths from assigned nodes
  - Average deaths per fight metrics
  - Sortable performance statistics

### User Experience
- **Secure Cloud Storage**: All data stored in Firebase Realtime Database
- **Share Links**: Easy alliance invitation with embedded keys
- **Alliance Key System**: Secure access control for officer collaboration
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Auto-save**: Changes saved automatically to Firebase
- **Collapsible Paths**: Keep your view clean and organized

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Firebase account (free tier works fine)

### Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Realtime Database**:
   - In your Firebase project, go to "Build" > "Realtime Database"
   - Click "Create Database"
   - Start in **test mode** (you can secure it later)
   - Choose a database location

3. **Get Your Firebase Config**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the configuration values

### Installation

1. **Clone or extract the project**:
   ```bash
   cd alliance-war-tracker-nextjs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase**:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Edit `.env.local` and add your Firebase credentials:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### First Time Setup
1. Enter your alliance name (e.g., "Elite Warriors")
2. Optionally add an alliance tag (e.g., "[EW]")
3. Click "Generate" to create a new alliance key
4. Click "Connect to Alliance Data"

### Adding Players
1. Click the "Players" button in the header
2. Enter player name and click "Add Player"
3. Assign players to Battlegroups (each BG holds 10 players)
4. Update player performance metrics:
   - **Path Fights**: Number of regular path nodes cleared
   - **Mini Boss Fights**: Number of mini boss/sub-boss takedowns

### Managing Wars
1. Click "New War" to start tracking a new war
2. Use the dropdown to switch between wars
3. Click "Delete War" to remove a war (requires confirmation)

### Tracking Nodes
1. Select a Battlegroup (BG1, BG2, or BG3)
2. Click a path to expand it
3. For each node:
   - Click the status button to cycle: Not Started → In Progress → Completed
   - Assign a player from the dropdown
   - Enter death count
   - Add notes if needed

### Attack Bonus
- Updates automatically based on total deaths
- Formula: 240 - (total deaths × 3)
- Click "Recalculate" to manually refresh

### Viewing Statistics
1. Click "Stats" in the header
2. View player performance metrics:
   - Path fights and mini boss fights taken
   - Total node assignments
   - Deaths and average deaths per fight
3. View war statistics by battlegroup

### Sharing with Officers
1. Click "Share Link" in the header
2. Send the link to your officers
3. They click the link and enter the alliance name
4. Everyone sees the same real-time data!

## 🏗️ Project Structure

```
alliance-war-tracker-nextjs/
├── app/
│   ├── globals.css         # Global styles and Tailwind config
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main entry point
├── components/
│   ├── BattlegroupContent.tsx  # BG display with paths and boss
│   ├── BattlegroupTabs.tsx     # BG switcher tabs
│   ├── Header.tsx              # App header with actions
│   ├── LoginScreen.tsx         # Alliance connection screen
│   ├── MainApp.tsx             # Main app coordinator
│   ├── NodeRow.tsx             # Individual node display
│   ├── PathCard.tsx            # Path with nodes
│   ├── PlayerManagement.tsx    # Player CRUD and assignment
│   ├── StatsModal.tsx          # Statistics and performance
│   └── WarManagement.tsx       # War selection controls
├── lib/
│   └── firebase.ts         # Firebase configuration
├── types/
│   └── index.ts            # TypeScript type definitions
├── .env.local.example      # Environment variables template
├── package.json            # Dependencies
└── README.md              # This file
```

## 🔒 Security Considerations

### Current Setup (Test Mode)
- Firebase Realtime Database is in test mode
- Anyone with the link can read/write data
- Perfect for small alliances and trusted officers

### Production Recommendations
1. **Enable Firebase Authentication**
2. **Set up Database Rules**:
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
3. **Use environment-specific configs**
4. **Monitor Firebase usage**

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Lint Code
```bash
npm run lint
```

## 📊 Data Model

### Alliance Data Structure
```typescript
{
  allianceName: string;
  allianceTag: string;
  currentWarIndex: number;
  players: Player[];
  wars: War[];
}
```

### Player Data
```typescript
{
  id: string;
  name: string;
  bgAssignment: number | null;  // 0, 1, 2 for BG1-3
  pathFightsTaken: number;
  miniBossFightsTaken: number;
  totalDeaths: number;
  isActive: boolean;
}
```

## 🤝 Contributing

Feel free to fork, modify, and enhance! Some ideas:
- Add authentication
- Import/export data
- Advanced analytics
- Discord/Slack integration
- Mobile app version

## 📝 License

This project is open source and available for alliance use.

## 🆘 Troubleshooting

### Firebase Connection Issues
- Check that all environment variables are set correctly
- Verify Firebase Database is enabled
- Ensure database rules allow read/write

### Data Not Syncing
- Check browser console for errors
- Verify internet connection
- Ensure all officers are using the same alliance key

### Players Not Showing in Dropdowns
- Make sure players are added via Player Management
- Verify players are assigned to the correct Battlegroup
- Refresh the page if data seems stale

## 💡 Tips

- Use descriptive alliance names
- Keep your alliance key secure (but shareable with officers)
- Regularly check player performance stats
- Update path fights and MB fights after each war
- Use the notes field for important node information

---

**Enjoy tracking your alliance wars! Good luck in the Contest!** 🎮⚔️
