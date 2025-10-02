# Doubles Queue App Requirements

## Overview
A queue management app for doubles games designed for group sessions with multiple courts. The app manages player rotation across courts, tracks performance statistics with numerical ratings, and ensures balanced matches based on player skill ratings. Exclusively designed for doubles play (4 players per game).

## Core Features

### 1. Player Management
- **Player Registration**: Simple name-based registration (no accounts required)
- **Numerical Rating System**: Assign initial rating (1000-3000 scale) to new players
- **Session Attendance**: Check-in players for each session
- **Player Status**: Track active/inactive players during the session

### 2. Multi-Court Queue Management
- **Dynamic Queue**: Add/remove players from the waiting queue
- **Fair Rotation**: Ensure players get equal playing opportunities across all courts
- **Priority System**: Longer waiting time = higher priority
- **Court Configuration**: Set number of available courts (1-4 courts)
- **Court Assignment**: Automatically assign balanced teams to available courts
- **Court Status**: Track which courts are occupied, available, or under maintenance

### 3. Doubles Team Formation & Balancing
- **Rating-Based Matching**: Form teams where combined team ratings are as close as possible
- **Balanced Doubles**: Create competitive 2v2 matches by balancing team ratings
- **Team Rating Calculation**: Sum of both players' ratings for team strength
- **Manual Override**: Allow organizers to manually adjust teams if needed

### 4. Game Tracking
- **Match Results**: Record win/loss and score for each game
- **Game Duration**: Track approximate game length for better queue estimation
- **Current Games**: Display ongoing matches and their status

### 5. Rating System & Performance
- **Numerical Rating**: Dynamic rating system (1000-3000 scale)
- **Win/Loss Record**: Track individual player statistics

## User Interface Requirements

### 1. Main Dashboard
- **Current Queue**: Display waiting players with ratings in priority order
- **Next in Line**: Display the next group to play when a court becomes available. It should also show the pairing.
- **Multi-Court View**: Show all courts with ongoing matches, players, and team ratings
- **Court Status**: Visual indicators for available, occupied, and maintenance courts
- **Session Summary**: Quick stats including average session rating and games completed
- **Quick Actions**: Add players, record results, manage courts, configure court count

### 2. Queue Management Screen
- **Add to Queue**: Interface to add players to waiting list
- **Court Selection**: Choose which court to assign next match to

### 3. Game Results Screen
- **Court Selection**: Choose which court's game to record results for
- **Team Display**: Show both teams with player names and current ratings
- **Winner Selection**: Simple tap to select winning team
- **Rating Preview**: Show predicted rating changes before confirming
- **Score Entry**: Optional detailed score input (21-19, 21-15, etc.)
- **Quick Entry**: Rapid result recording with automatic rating updates

### 4. Statistics Screen
- **Player List**: Sortable by rating, wins, win rate, games played, rating change
- **Individual Stats**: Detailed view showing rating history graph, recent games, and trends
- **Session Stats**: Current session summary including rating changes and court utilization
- **Historical Data**: Rating progression over multiple sessions with graphs

## Technical Requirements

### 1. Data Storage
- **Local Storage**: Use browser localStorage for session and rating data
- **Player Ratings**: Persistent storage of player ratings across sessions
- **Game History**: Store complete match history with rating changes
- **Court Configuration**: Save court count and settings
- **Data Persistence**: Maintain all data between browser sessions
- **Export/Import**: Ability to backup and restore complete player database
- **Session Management**: Separate session data while maintaining persistent ratings

### 2. Platform Requirements
- **Mobile Web App**: Progressive Web App (PWA) for mobile browsers
- **Touch-First Design**: Interface designed specifically for touch interactions
- **Offline Capable**: Function without internet connection
- **Mobile Browser Support**: Compatible with Safari (iOS) and Chrome (Android)

### 3. Performance
- **Fast Loading**: Quick startup for immediate use
- **Real-time Updates**: Instant UI updates when queue changes
- **Smooth Animations**: Pleasant transitions for better UX
- **Minimal Data**: Efficient storage usage

## User Experience Requirements

### 1. Ease of Use
- **Intuitive Interface**: Clear, simple navigation
- **One-Touch Actions**: Minimize taps for common operations
- **Visual Feedback**: Clear confirmation of actions
- **Error Prevention**: Prevent common user mistakes

### 2. Session Flow
- **Setup Phase**: Quick player check-in at session start
- **Game Management**: Smooth queue and match management during play
- **Results Entry**: Fast result recording between games
- **Session End**: Easy session wrap-up and stats review

### 3. Mobile Accessibility
- **Large Touch Targets**: Minimum 44px touch targets for easy finger interaction
- **Clear Typography**: Large, readable text optimized for small screens
- **Color Coding**: High contrast color system for outdoor/indoor lighting
- **Thumb-Friendly Layout**: Important controls within easy thumb reach

## Rating System Formula

### Rating Calculation
The app uses an Elo-style rating system adapted for doubles badminton:

**Initial Rating**: New players start at 1500 points

**Rating Range**: 1000 (beginner) to 3000 (expert)

**Rating Change Formula**:
```
ΔRating = K × (Actual - Expected)
```

Where:
- **K-Factor**: 32 for players with <30 games, 16 for experienced players
- **Actual**: 1 for win, 0 for loss
- **Expected**: Probability of winning based on rating difference

**Expected Score Calculation**:
```
Expected_A = 1 / (1 + 10^((Rating_B - Rating_A) / 400))
```

Where:
- Rating_A = Average rating of Team A (Player1 + Player2) / 2
- Rating_B = Average rating of Team B (Player3 + Player4) / 2

**Example Scenarios**:
1. **Evenly Matched Teams** (1500 vs 1500 avg): Winner gains ~16 points, loser loses ~16 points
2. **Upset Victory** (1400 vs 1600 avg): Underdog wins +24 points, favorite loses -24 points
3. **Expected Victory** (1600 vs 1400 avg): Favorite wins +8 points, underdog loses -8 points

**Rating Categories**:
- 1000-1199: Beginner
- 1200-1399: Novice
- 1400-1599: Intermediate
- 1600-1799: Advanced
- 1800-1999: Expert
- 2000+: Master

## Business Rules

### 1. Multi-Court Queue Logic & Balancing Algorithm

#### Player Selection Algorithm
The app uses a **weighted scoring system** to balance wait time fairness with match quality:

**Player Priority Score Formula**:
```
Priority Score = (Wait Time Score × 0.6) + (Balance Score × 0.4)
```

**Wait Time Score Calculation**:
- Base: Minutes waiting × 10 points
- Bonus: +50 points if haven't played in current session
- Penalty: -20 points per game played this session (diminishing returns)

**Balance Score Calculation**:
- Measures how well a player fits into balanced team combinations
- Higher score for players whose rating creates more balanced matchups
- Considers all possible team formations with current queue

#### Detailed Algorithm Steps:

1. **Queue Management**:
   - Players automatically join queue after finishing a game
   - Queue serves multiple courts simultaneously
   - Track wait time, games played, and last game time for each player

2. **Team Formation Process** (when court becomes available):
   - **Step 1**: Calculate priority scores for all waiting players
   - **Step 2**: Generate all possible 4-player combinations from top 8-12 priority players
   - **Step 3**: For each combination, calculate team balance quality:
     ```
     Balance Quality = 100 - |Team1_Avg_Rating - Team2_Avg_Rating|
     ```
   - **Step 4**: Select combination with highest combined priority + balance score

3. **Fallback Rules**:
   - If no balanced match possible (rating diff >200), prioritize wait time
   - If player waits >30 minutes, guarantee next available game regardless of balance
   - Manual override always available for organizers

#### Example Scenarios:

**Scenario A - Balanced Wait Times**:
- 4 players waiting ~10 minutes each, similar ratings
- Result: Form most balanced teams from these 4

**Scenario B - Long Wait vs Balance**:
- Player A: 35 minutes waiting (1800 rating)
- Players B,C,D: 5 minutes waiting (1400-1450 ratings)
- Result: Player A plays next (30+ minute rule), find best partners

**Scenario C - Multiple Court Optimization**:
- 8 players waiting, 2 courts available
- Algorithm finds best 2 simultaneous matches considering both wait times and balance
- Avoids putting all long-waiting players in same game

#### Balance Tolerance Settings:
- **Preferred**: Team rating difference <100 points
- **Acceptable**: Team rating difference <200 points  
- **Emergency**: Any combination if someone waits >30 minutes

### 2. Doubles Match Making

#### Core Rules:
- Form teams of exactly 2 players each (4 players total per game)
- Balance team ratings (average of 2 players' ratings per team)
- Ensure even playing time distribution across all courts
- Allow manual overrides when needed

#### Partnership Rotation Logic:
- Track recent partnerships (last 3 games)
- **Penalty System**: Reduce priority score by 30 points for recent partnerships
- **Exception**: If only option for balanced game or long wait (25+ minutes)

#### Multi-Court Considerations:
- When multiple courts available, optimize globally across all courts
- Distribute waiting times evenly across court assignments

#### Edge Case Handling:
1. **Odd Numbers**: If 5-7 players available, select best 4 based on algorithm
2. **Skill Gaps**: If large rating spread (>800 points), prioritize wait time over balance

### 3. Rating & Statistics Rules
- Count only completed games toward rating changes
- Apply rating changes immediately after game completion
- Track both individual ratings and partnership performance
- Rating changes based on team performance, not individual play
- Maintain historical data for rating trends and game history
- Minimum 5 games before rating stabilizes (use higher K-factor initially)

- **No User Accounts**: Simple name-based identification only
- **No Server Required**: Fully client-side application
- **Mobile Only**: Designed exclusively for mobile browser access
- **Simple Setup**: Minimal configuration required for first use
- **Cost**: Free to use, no subscription or payment features needed