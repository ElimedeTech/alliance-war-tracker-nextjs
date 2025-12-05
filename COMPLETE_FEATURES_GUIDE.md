# Alliance War Tracker v3.0 - Complete Feature Guide

## 🎯 ALL 9 Requirements Implemented ✅

This version addresses EVERY scenario you requested, modeled after actual MCOC Alliance War mechanics.

---

## 1️⃣ Players Assigned to BGs and Paths ✅

### Implementation:
- **Player Management:** Each player can be assigned to BG1, BG2, or BG3
- **Path Assignment:** Primary player assigned to each path
- **Capacity Control:** 10 players per BG (enforced with visual indicators)

### How to Use:
1. Click "Players" button
2. Add all 30 alliance members
3. Assign 10 players to each BG using dropdown
4. Each path can have one primary player + multiple backups

### Visual Indicators:
- BG capacity: "BG1 (8/10)" in green, "BG1 (10/10)" in red
- Progress bars showing BG fill status
- Color-coded BG assignments (BG1=Blue, BG2=Green, BG3=Purple)

---

## 2️⃣ Player Transfer Between BGs ✅

### Implementation:
- **One BG at a time:** Players can only be in one BG
- **Transfer functionality:** Move players between BGs with confirmation
- **Capacity checking:** Prevents transfers to full BGs

### How to Use:
**In Player Management:**
1. Find player you want to transfer
2. Click their BG dropdown
3. Select new BG
4. Confirm transfer

**What Happens:**
```
Example: Transfer "Iceman" from BG1 to BG2
Before: BG1 (10/10) → BG2 (8/10)
After:  BG1 (9/10)  → BG2 (9/10)
```

### Protections:
- ✅ Can't assign to full BG (shows "BG2 is full!" alert)
- ✅ Confirmation dialog prevents accidental transfers
- ✅ Shows current BG counts in dropdown

---

## 3️⃣ Death Count Per Path ✅

### Implementation:
- **Total path deaths:** Sum of all node deaths in path
- **Node-level tracking:** Each of 4 nodes tracks deaths separately
- **Automatic calculation:** Path total updates when node deaths change

### How to Use:
1. Expand any path (e.g., Path 1)
2. Each node shows death counter
3. Path header shows total: "Path 1 Deaths: 8"

### Calculation:
```
Path 1 Nodes:
- Node 1: 2 deaths
- Node 2: 3 deaths  
- Node 3: 1 death
- Node 4: 2 deaths
─────────────────
Total: 8 deaths
```

---

## 4️⃣ Backup Player Assists on Path ✅

### Implementation:
- **Primary + Backup system:** Each node supports multiple players
- **Role tracking:** "Primary" or "Backup" designation
- **Individual death tracking:** Each player's deaths tracked separately

### Scenario: Backup Assists Primary Player

**Example:**
```
Path 5, Node 18 - Difficult Defender

Primary Player: "Doom" (assigned to Path 5)
└─ Deaths: 2

Backup Player: "Hercules" (assists)
└─ Deaths: 1

Total Node Deaths: 3
```

### How to Use:
1. Expand path, select node
2. Assign primary player (blue section)
3. Click "+ Add Backup Player" (orange section)
4. Select backup player
5. Enter deaths for each player separately
6. Total deaths auto-calculates

### Visual:
```
Node #18 [○]
┌─────────────────────────────┐
│ 🎯 Primary Player           │
│ ┌─────────────────────────┐ │
│ │ Doom        Deaths: [2] │ │ (Blue background)
│ └─────────────────────────┘ │
│                             │
│ 🛡️ Backup Players (1)      │
│ ┌─────────────────────────┐ │
│ │ Hercules    Deaths: [1] │ │ (Orange background)
│ └─────────────────────────┘ │
│                             │
│ Total Deaths: 3             │ (Red background)
└─────────────────────────────┘
```

---

## 5️⃣ Backup Covers for No-Show Player ✅

### Implementation:
- **Same mechanism as #4**
- **No primary required:** Can assign backup without primary
- **Full coverage:** Backup becomes de-facto primary for the node

### Scenario: Primary Player No-Show

**Example:**
```
Path 7, Node 27

Primary Player: "Magneto" (NO-SHOW - didn't take node)
Action: Remove Magneto, add backup

Backup Player: "Storm" (covers entire node)
└─ Deaths: 3

Result: Node cleared by backup only
```

### How to Use:
1. **If primary didn't show:**
   - Click ✕ to remove primary player
   - Add backup player
   - Track backup's deaths

2. **If you know primary won't show:**
   - Assign backup directly as "primary"
   - Or use backup section

### Tracking:
- Backup player's stats update: `pathFightsTaken += 1`
- Their deaths tracked separately
- Clear notes: "Storm covered for Magneto"

---

## 6️⃣ Backup Assists on Mini Boss ✅

### Implementation:
- **Same system for mini bosses:** Nodes 37-49 have identical player assignment
- **Multiple players:** Primary + unlimited backups
- **Individual tracking:** Each player's contribution tracked

### Scenario: Mini Boss Takedown

**Example:**
```
Mini Boss - Node 42 (Difficult Defender)

Primary Player: "Corvus" 
└─ Deaths: 4 (tried but couldn't finish)

Backup Player 1: "Ghost"
└─ Deaths: 2 (helped, still not enough)

Backup Player 2: "Quake"
└─ Deaths: 1 (finished the boss)

Total Deaths: 7
All 3 players get MB fight credit!
```

### How to Use:
**In Mini Boss Section (Nodes 37-49):**
1. Each mini boss has same layout as path nodes
2. Assign primary player
3. Add backup players as needed
4. Track deaths per player
5. All assigned players get `miniBossFightsTaken += 1`

### Typical Flow:
```
1. Corvus tries Node 42 → fails (4 deaths)
2. Ghost assists → fails (2 deaths)  
3. Quake finishes → success (1 death)
4. Total: 7 deaths, 3 players credited
```

---

## 7️⃣ Path Fights & Mini Boss Fights Count ✅

### Implementation:
- **Two separate counters per player:**
  - `pathFightsTaken`: Nodes 1-36 (path nodes)
  - `miniBossFightsTaken`: Nodes 37-49 (mini bosses)
- **Automatic tracking:** Increments when assigned to nodes
- **Manual adjustment:** Can edit in Player Management

### Tracking Logic:
```javascript
Player gets assigned to node:
- If node 1-36 → pathFightsTaken++
- If node 37-49 → miniBossFightsTaken++
- If node 50 → counts as boss fight

Player can have multiple assignments:
- Path 5, Node 18 (primary)
- Path 7, Node 29 (backup)
- Mini Boss Node 42 (backup)
→ pathFightsTaken = 2, miniBossFightsTaken = 1
```

### How to Use:

**Automatic (Recommended):**
- System tracks based on node assignments
- After war, numbers reflect actual participation

**Manual Update:**
- Player Management → Select player
- Edit "Path Fights" or "MB Fights" counters
- Use after war for final tallies

### Statistics View:
```
Player: Doom
├─ Path Fights: 8
├─ Mini Boss Fights: 3
├─ Total Fights: 11
├─ Total Deaths: 12
└─ Avg Deaths/Fight: 1.09
```

---

## 8️⃣ Attack Bonus Points Calculation ✅

### Based on MCOC Screenshot:
**"Each node has a bonus amount. You lose one bonus each time you lose a fight on that node."**

### Implementation:
- **Node bonus points:** Each node has configurable bonus (default: 90)
- **Death penalty:** Each death on node = -1 bonus lost
- **Total calculation:** Sum remaining bonus across all nodes

### Formula:
```
Node Remaining Bonus = Node Bonus Points - Deaths on Node

Example Node:
- Bonus Points: 90
- Deaths: 3
- Remaining: 87

Total Attack Bonus = Sum of all node remaining bonuses
```

### Typical Scenario:
```
BG1 Statistics:

Path Nodes (1-36):
- 36 nodes × 90 pts = 3,240 max
- Total path deaths: 25
- Path bonus remaining: 3,240 - 25 = 3,215

Mini Bosses (37-49):
- 13 MBs × 90 pts = 1,170 max
- Total MB deaths: 42
- MB bonus remaining: 1,170 - 42 = 1,128

Final Boss (50):
- 1 boss × 90 pts = 90 max
- Boss deaths: 5
- Boss bonus remaining: 90 - 5 = 85

────────────────────────────────
Total Attack Bonus: 4,428 points
Total Deaths: 72
```

### How to Use:

**Set Node Bonus:**
1. Each node has "Bonus" input field (default: 90)
2. Adjust if different map tier (e.g., Tier 1 might be 100 pts/node)
3. System auto-calculates remaining bonus

**View Attack Bonus:**
- BG stats show: "Attack Bonus: 4,428"
- Breakdown shows: Path bonus, MB bonus, Boss bonus
- Matches MCOC screenshot format!

### Configurable Per War:
```javascript
Create war with custom settings:
- Map Tier 1: 100 pts/node
- Map Tier 5: 80 pts/node
- Or use default: 90 pts/node
```

---

## 9️⃣ Path Deaths & Boss Deaths in Stats ✅

### Implementation:
- **Detailed breakdown:** Stats modal shows all death categories
- **Per-BG tracking:** Each BG shows separate stats
- **Historical data:** Track across multiple wars

### Statistics Display:

```
┌─── War 3 Statistics ───────────────────┐
│                                         │
│ BG1                                     │
│ ├─ Progress: 48/50 (96%)               │
│ │  ├─ Nodes: 35/36                     │
│ │  ├─ Mini Bosses: 12/13               │
│ │  └─ Final Boss: 1/1                  │
│ ├─ Attack Bonus: 4,428                 │
│ ├─ Path Deaths: 25                     │ ← Requirement #9
│ ├─ Mini Boss Deaths: 42                │
│ ├─ Boss Deaths: 5                      │ ← Requirement #9
│ └─ Total Deaths: 72                    │
│                                         │
│ BG2                                     │
│ ├─ Progress: 50/50 (100%)              │
│ ├─ Attack Bonus: 4,515                 │
│ ├─ Path Deaths: 18                     │
│ ├─ Mini Boss Deaths: 35                │
│ ├─ Boss Deaths: 2                      │
│ └─ Total Deaths: 55                    │
│                                         │
│ BG3                                     │
│ ├─ (similar breakdown)                 │
│                                         │
│ Alliance Totals:                        │
│ ├─ Total Path Deaths: 68               │
│ ├─ Total MB Deaths: 119                │
│ ├─ Total Boss Deaths: 12               │
│ ├─ Total Deaths: 199                   │
│ └─ Combined Attack Bonus: 13,281       │
└─────────────────────────────────────────┘
```

### Export Options:
- Copy stats to clipboard
- Export as CSV
- Share summary in alliance chat

---

## 🎮 Complete Workflow Example

### Pre-War Setup:
```
1. Add all 30 players
2. Assign 10 to each BG
3. Mark 3-5 players as "Backup" (⭐)
4. Create new war
```

### During War:

**Path Assignments:**
```
Path 1: Doom (primary)
Path 2: Ghost (primary) + Quake (backup)
Path 3: Corvus (primary)
...etc
```

**Path Node Scenario:**
```
Path 2, Node 6:
- Ghost tries: 2 deaths
- Ghost stuck, calls backup
- Quake finishes: 1 death
- Total: 3 deaths
- Both players credited for path fight
```

**Mini Boss Scenario:**
```
Mini Boss Node 42:
- Corvus tries: 4 deaths (fails)
- Ghost assists: 2 deaths (fails)
- Doom finishes: 1 death (success)
- Total: 7 deaths
- All 3 players get MB fight credit
```

**Final Boss:**
```
Boss Node 50:
- Multiple players coordinate
- Track each player's deaths
- All contributors credited
```

### Post-War:
```
1. Review stats dashboard
2. Export data
3. Update player fight counts if needed
4. Prepare for next war
```

---

## 📊 Player Performance Tracking

### Comprehensive Stats:
```
Player: Ghost
├─ BG Assignment: BG2
├─ Path Fights Taken: 12
├─ Mini Boss Fights Taken: 4
├─ Total Fights: 16
├─ Total Deaths: 18
├─ Avg Deaths/Fight: 1.13
├─ Efficiency Rating: Excellent
└─ Backup Assists: 5
```

### Leaderboards:
- Most path fights
- Most MB fights  
- Lowest deaths
- Best efficiency
- Most backup assists

---

## 🎯 Key Features Summary

### ✅ Requirement 1: BG & Path Assignment
- 10 players per BG enforced
- Visual capacity indicators
- Path-level primary assignments

### ✅ Requirement 2: BG Transfers
- One BG at a time
- Easy dropdown transfer
- Capacity checking

### ✅ Requirement 3: Death Count Per Path
- Automatic summation
- Node-level tracking
- Path totals displayed

### ✅ Requirement 4: Backup Assists Primary
- Multiple players per node
- Individual death tracking
- Role designation (primary/backup)

### ✅ Requirement 5: Backup Covers No-Show
- Flexible player removal
- Backup-only assignments
- Full credit to backup

### ✅ Requirement 6: Backup on Mini Boss
- Identical system for MBs
- Multiple player support
- Individual contribution tracking

### ✅ Requirement 7: Fight Counters
- Separate path/MB counters
- Automatic tracking
- Manual adjustment option

### ✅ Requirement 8: Attack Bonus
- Node bonus points (configurable)
- Death penalty calculation
- MCOC-accurate formula

### ✅ Requirement 9: Stats Dashboard
- Path deaths breakdown
- MB deaths breakdown
- Boss deaths breakdown
- Per-BG and alliance totals

---

## 🚀 Launch Checklist

### Before Season Starts:
- [ ] Download v3.0 package
- [ ] Test locally with mock data
- [ ] Deploy to Vercel
- [ ] Add all 30 players
- [ ] Assign to BGs (10 each)
- [ ] Mark backup players

### First War:
- [ ] Create War 1
- [ ] Assign primary players to paths
- [ ] Track nodes with backup system
- [ ] Monitor attack bonus
- [ ] Review stats after war

### Ongoing:
- [ ] Update player stats weekly
- [ ] Track backup performance
- [ ] Export war data
- [ ] Share with alliance

---

## 💡 Pro Tips

### Backup Player Strategy:
1. Mark 3-5 players as backup (⭐)
2. Assign backups to multiple BGs
3. Use for emergencies and tough nodes
4. Track backup efficiency

### Attack Bonus Optimization:
1. Set accurate node bonus points
2. Monitor death counts in real-time
3. Focus on low-death clears
4. Compare with opponent

### Player Performance:
1. Review stats after each war
2. Identify top performers
3. Adjust assignments based on data
4. Reward consistent players

---

## 📱 Mobile-Friendly

All features work on mobile:
- Touch-friendly buttons
- Responsive layouts
- Easy player assignment
- Quick death tracking

---

## 🎉 You're Ready!

With this system, you can:
- ✅ Handle all backup scenarios
- ✅ Track every death accurately  
- ✅ Calculate precise attack bonus
- ✅ Generate comprehensive stats
- ✅ Manage 30 players across 3 BGs
- ✅ Export and share data
- ✅ Optimize war strategy

**Everything you need for professional Alliance War tracking!** 🏆
