# 🤠 Operation: Django Salsa 🕵️

A gamified date night experience combining western grit with spy finesse. Transform your evening into an interactive mission with objectives, achievements, and point tracking.

## 🎯 What Is This?

Operation Django Salsa is a single-page web application that turns a date night into an engaging game. Players complete missions, earn points, unlock achievements, and track their progress through a structured evening of activities.

**Perfect for:**
- Creative date nights
- Anniversary celebrations
- Memorable experiences with your partner
- Anyone who loves gamification and themed activities

## ✨ Features

- **5 Time-Gated Missions** - Unlock progressively throughout the evening
- **Dynamic Task System** - Main objectives, mini-games, and side quests
- **Reroll Mechanism** - Don't like a task? Reroll it (with penalties)
- **Secret Mission** - Phrase-activated covert operation
- **Witching Hour Challenges** - 10 bonus missions unlocked at 11 PM
- **Achievement System** - 8 achievements to unlock
- **Rank Progression** - From "Rookie Recruits" to "Legendary Partners"
- **Auto-Save** - Progress persists through page refreshes
- **Test Mode** - Preview and test all features

## 🎮 How to Use

### For the Organizer:

1. **Open the HTML file** in your web browser
2. **Click "INITIATE OPERATION"** to begin
3. **Check off tasks** as you complete them throughout the evening
4. **Track your score** and unlock achievements
5. **Complete the operation** at the end of the night

### Test Mode:

- Click "🔧 TEST MODE" on the landing page
- Password: `Echo`
- Features:
  - Set custom time to preview missions
  - Toggle time restrictions
  - Test all game mechanics

## 📅 Default Schedule

The app is pre-configured for a specific date night structure:

| Time | Mission | Activities |
|------|---------|------------|
| **17:00-17:45** | Rendezvous at the Hideout | Welcome drinks, cooking nachos, movie setup |
| **17:45-21:00** | The Django Protocol | Watch Django Unchained (3 hours) |
| **21:00-21:15** | Showdown at Sundown | Movie finale, share reactions |
| **21:15-22:00** | The Road to the Saloon | Travel, conversation games |
| **22:00-Late** | Infiltrating the Tilted Saloon | Games, drinks, entertainment |

## 🎨 Customization

To customize for your own date:

1. **Edit Mission Times**: Modify `startTime` and `endTime` in the `missions` array (line ~1268)
2. **Change Tasks**: Update `mainObjectives`, `miniGames`, and `sideQuests` arrays
3. **Adjust Locations**: Update the landing page briefing text (line ~945)
4. **Modify Codenames**: Change "Agent Wildflower" and "The Onion Slayer" throughout
5. **Update Date**: Change the date in the landing briefing (line ~948)

## 🏆 Scoring System

| Action | Points |
|--------|--------|
| Main Objective Completed | +100 |
| Mini-Game Completed | +30 |
| Side Quest Completed | +20 |
| Secret Mission Completed | +75 |
| Witching Hour Mission | +40 |
| Task Reroll | -10/-20/-30 |
| Missed Main Objective | -50 |
| Secret Mission Failed | -30 |

### Ranks:
- 🏅 **Rookie Recruits** (0+ pts)
- 🥉 **Capable Operatives** (200+ pts)
- 🥈 **Skilled Agents** (400+ pts)
- 🥇 **Elite Partners** (600+ pts)
- 💎 **Master Spies** (800+ pts)
- 👑 **Legendary Partners** (1000+ pts)

## 💾 Technical Details

- **Pure HTML/CSS/JavaScript** - No dependencies required
- **LocalStorage** - Auto-saves game state
- **Responsive Design** - Works on mobile and desktop
- **Self-Contained** - Single file, works offline

## 🚀 Deployment Options

### GitHub Pages (Recommended):
1. Create a new repository
2. Upload the HTML file as `index.html`
3. Enable GitHub Pages in Settings → Pages
4. Share your link: `https://yourusername.github.io/repo-name`

### Other Options:
- **Netlify Drop**: Drag and drop at [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: Deploy at [vercel.com](https://vercel.com)
- **Local File**: Simply open the HTML file in any browser

## 📱 Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## 🎭 Theme

**Spy-Western Fusion**: Combines the intrigue of espionage with the grit of the Old West. Codenames, mission briefings, and western aesthetics create an immersive experience.

## 🔒 Secret Mission

The app includes a phrase-activated secret mission mechanic. When the designated phrase is spoken during the date, the secret mission unlocks with a timer and bonus points.

**Default phrase:** *"In the land where salsa meets sundown, the quickest draw isn't always the gun."*

## 🌙 Witching Hour

Between 23:00-00:00, 10 special "Witching Hour Challenges" unlock for bonus points. Complete all 10 to unlock the "Night Owl" achievement.

## ⚙️ Clear Save Data

If you want to restart from scratch:
- Click the "🗑️ Clear Save" button in the app header
- Or manually clear your browser's localStorage

## 📄 License

Free to use and customize for personal date nights. Feel free to adapt it for your own experiences!

## 💡 Tips

- **Charge your phone** - You'll be checking tasks throughout the night
- **Don't stress about perfect scores** - It's about having fun together
- **Use rerolls strategically** - Save them for tasks you really don't want to do
- **Take photos** - Many tasks involve capturing memories
- **Be flexible** - Adapt the game to your actual experience

## 🎉 Credits

Created for an unforgettable date night experience on December 6, 2025.

---

**Ready to start your operation?** Open the HTML file and click "INITIATE OPERATION"! 🎯
