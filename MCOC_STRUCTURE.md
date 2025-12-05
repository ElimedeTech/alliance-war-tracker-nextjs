# MCOC Alliance War Map Structure - CORRECTED ✅

## 🎮 Actual MCOC Alliance War Map

Your alliance war tracker now matches the **actual Marvel Contest of Champions Alliance War map structure**:

### Correct Node Layout

```
Nodes 1-36:   Path Nodes (9 paths × 4 nodes = 36 nodes)
Nodes 37-49:  Mini Bosses (13 mini bosses)
Node 50:      Final Boss (1 boss)
───────────────────────────────────────────────────
Total:        50 nodes per Battlegroup
```

## 📊 Detailed Breakdown

### Path Nodes (1-36)

**9 Paths with 4 Nodes Each:**
- Path 1: Nodes 1-4
- Path 2: Nodes 5-8
- Path 3: Nodes 9-12
- Path 4: Nodes 13-16
- Path 5: Nodes 17-20
- Path 6: Nodes 21-24
- Path 7: Nodes 25-28
- Path 8: Nodes 29-32
- Path 9: Nodes 33-36

### Mini Bosses (37-49)

**13 Mini Boss Nodes:**
- Node 37
- Node 38
- Node 39
- Node 40
- Node 41
- Node 42
- Node 43
- Node 44
- Node 45
- Node 46
- Node 47
- Node 48
- Node 49

### Final Boss (50)

**1 Alliance Boss:**
- Node 50

## ✅ What Was Fixed

### Before (WRONG ❌)
```javascript
{
  paths: 9 paths × 10 nodes = 90 nodes  // WRONG!
  boss: 1 boss
  // Missing mini bosses completely!
}
```

### After (CORRECT ✅)
```javascript
{
  paths: 9 paths × 4 nodes = 36 nodes  // CORRECT!
  miniBosses: 13 mini bosses            // ADDED!
  boss: 1 final boss                    // CORRECT!
}
```

## 🎯 Features by Section

### Path Nodes (1-36)
- ✅ Collapsible paths
- ✅ 4 nodes per path
- ✅ Status tracking (not started, in progress, completed)
- ✅ Death counter per node
- ✅ Player assignment
- ✅ Notes field

### Mini Bosses (37-49)
- ✅ Grid display (3 columns on large screens)
- ✅ Node number clearly displayed
- ✅ Status tracking
- ✅ Death counter
- ✅ Player assignment
- ✅ Notes field
- ✅ Orange color scheme (distinct from paths)

### Final Boss (50)
- ✅ Prominent display
- ✅ Node 50 label
- ✅ Status tracking
- ✅ Death counter
- ✅ Player assignment
- ✅ Notes field
- ✅ Red color scheme

## 📈 Attack Bonus Calculation

**Formula:** `240 - (Total Deaths × 3)`

**Total Deaths includes:**
- Path node deaths (nodes 1-36)
- Mini boss deaths (nodes 37-49)
- Final boss deaths (node 50)

**Example:**
```
Path Deaths:        12
Mini Boss Deaths:    8
Final Boss Deaths:   3
───────────────────────
Total Deaths:       23
Attack Bonus:       240 - (23 × 3) = 171
```

## 🎨 Visual Layout

### In the App

**Path Section:**
```
┌─────────────────────────────────┐
│ Path 1 (Nodes 1-4)              │
│   #1  ○  [Assign] Deaths: 0     │
│   #2  ○  [Assign] Deaths: 0     │
│   #3  ○  [Assign] Deaths: 0     │
│   #4  ○  [Assign] Deaths: 0     │
└─────────────────────────────────┘
```

**Mini Boss Section:**
```
┌───────────────── Mini Bosses (Nodes 37-49) ─────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐                                  │
│ │Node37│ │Node38│ │Node39│ ...  (13 mini bosses)            │
│ │  ○   │ │  ○   │ │  ○   │                                  │
│ └──────┘ └──────┘ └──────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

**Final Boss Section:**
```
┌──────────── Final Boss - Node 50 ────────────┐
│ Status: [Not Started ▼]                      │
│ Player: [Assign Player ▼]                    │
│ Deaths: [ 0 ]                                │
│ Notes:  [____________]                       │
└──────────────────────────────────────────────┘
```

## 📊 Statistics Display

### War Stats Now Show:
- Path Deaths (nodes 1-36)
- Mini Boss Deaths (nodes 37-49) ← NEW!
- Boss Deaths (node 50)
- Total Deaths (all combined)
- Progress: X/50 nodes (shows paths, MBs, and boss separately)

**Example Stats:**
```
BG1 Statistics:
├─ Progress: 45/50 (90%)
│  ├─ Nodes: 35/36
│  ├─ Mini Bosses: 9/13
│  └─ Final Boss: 1/1
├─ Attack Bonus: 189
├─ Path Deaths: 8
├─ Mini Boss Deaths: 9
├─ Boss Deaths: 0
└─ Total Deaths: 17
```

## 🔧 Player Performance Tracking

### Mini Boss Fights Counter
Players now have separate tracking for:
- **Path Fights:** Regular path nodes (1-36)
- **Mini Boss Fights:** Mini boss takedowns (37-49) ← Matches your request!
- **Total Assignments:** All nodes assigned across wars
- **Deaths:** Calculated from all assigned nodes

**In Player Management:**
```
Player: Iceman
├─ BG Assignment: BG2
├─ Path Fights: 8
├─ Mini Boss Fights: 3  ← Mini boss counter!
├─ Total Deaths: 12
└─ Avg Deaths/Fight: 1.09
```

## 🎯 Data Structure

### TypeScript Types

```typescript
interface Node {
  id: string;
  nodeNumber: number;      // 1-36 for path nodes
  status: 'not-started' | 'in-progress' | 'completed';
  deaths: number;
  assignedPlayer: string;
  notes: string;
}

interface MiniBoss {
  id: string;
  nodeNumber: number;      // 37-49 for mini bosses
  status: 'not-started' | 'in-progress' | 'completed';
  deaths: number;
  assignedPlayer: string;
  notes: string;
}

interface Boss {
  id: string;
  nodeNumber: number;      // 50 for final boss
  status: 'not-started' | 'in-progress' | 'completed';
  deaths: number;
  assignedPlayer: string;
  notes: string;
}

interface Battlegroup {
  paths: Path[];           // 9 paths with 4 nodes each
  miniBosses: MiniBoss[];  // 13 mini bosses
  boss: Boss;              // 1 final boss
  attackBonus: number;
  players: string[];
}
```

## ✅ Verification Checklist

When you launch the app, verify:

### Path Section
- [ ] 9 paths visible
- [ ] Each path has 4 nodes
- [ ] Node numbers: 1-4, 5-8, 9-12, ..., 33-36
- [ ] All paths collapsible

### Mini Boss Section
- [ ] 13 mini bosses displayed
- [ ] Node numbers: 37-49
- [ ] Orange color scheme
- [ ] Grid layout (3 columns)

### Boss Section
- [ ] Shows "Node 50"
- [ ] Player assignment dropdown
- [ ] Death counter
- [ ] Notes field

### Statistics
- [ ] Path deaths counted
- [ ] Mini boss deaths counted separately
- [ ] Boss deaths counted
- [ ] Total deaths = path + MB + boss
- [ ] Attack bonus = 240 - (total × 3)

### Player Management
- [ ] Path Fights counter
- [ ] Mini Boss Fights counter
- [ ] Both display in stats

## 🎮 Usage Example

**Typical War Flow:**

1. **Clear Paths (Nodes 1-36)**
   - Officers clear regular path nodes
   - Track assignments and deaths
   - 9 paths × 4 nodes = 36 fights

2. **Take Down Mini Bosses (Nodes 37-49)**
   - After paths clear, officers target mini bosses
   - 13 mini boss fights
   - Track separately from path fights

3. **Final Boss (Node 50)**
   - Alliance coordinates for final boss
   - 1 boss fight
   - Victory! 🏆

## 📝 Notes

- Total of 50 nodes per battlegroup (correct MCOC structure)
- Mini bosses are visually distinct (orange) from paths (purple)
- All deaths count toward attack bonus calculation
- Player stats track path fights and mini boss fights separately
- Node numbers always visible for easy reference

## 🚀 Ready to Use!

This structure now **exactly matches** the Marvel Contest of Champions Alliance War map. No more confusion about node counts or missing mini bosses!

**Download the corrected version and test it out!** 🎉
