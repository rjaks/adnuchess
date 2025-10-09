# PuzzleNida System

PuzzleNida is a chess puzzle management system integrated into the AdNU Chess Arena platform. It allows administrators to create, manage, and track chess puzzles, while providing players with an engaging way to solve tactical problems and improve their chess skills.

## Features

### For Administrators
- **Puzzle Creation**: Create chess puzzles with FEN positions, solutions, difficulty levels, and themes
- **Puzzle Management**: Edit, activate/deactivate, and delete puzzles
- **Visual Chess Board Editor**: Set up positions using an interactive chess board
- **Statistics Dashboard**: Track puzzle performance, submission rates, and user engagement
- **Admin-Only Access**: Secure administrative interface restricted to authorized users

### For Players
- **Puzzle Solving**: Solve chess puzzles with real-time timer
- **Difficulty Filtering**: Filter puzzles by difficulty level (Beginner, Intermediate, Advanced, Expert)
- **Theme Filtering**: Search puzzles by tactical themes (mate in 2, fork, pin, etc.)
- **Progress Tracking**: Track solved puzzles, points earned, and success rate
- **Leaderboard**: Compete with other players and view rankings
- **Immediate Feedback**: Get instant feedback on submissions with correct solutions

## Getting Started

### Setting Up Admin Access

1. **First Time Setup**:
   - Log in to the chess platform with your ADNU email
   - Navigate to `/admin/setup`
   - Click "Grant Admin Privileges" to make yourself an admin
   - This is a one-time setup process

2. **Configure Your Email**:
   - Edit `pages/admin/puzzles.vue` and `pages/admin/index.vue`
   - Replace `'your-admin-email@gbox.adnu.edu.ph'` with your actual ADNU email address
   - This ensures only you have admin access

### Creating Your First Puzzle

1. Navigate to `/admin/puzzles` (Admin Panel)
2. Click "Create New Puzzle"
3. Fill in the puzzle details:
   - **Title**: Descriptive name for the puzzle
   - **Description**: Optional hint or context
   - **Difficulty**: Choose appropriate difficulty level
   - **Points**: Points awarded for solving (1-100)
   - **Theme**: Optional tactical theme (e.g., "mate_in_2", "fork", "pin")
   - **FEN Position**: Chess position in FEN notation
   - **Solution**: Correct move sequence in algebraic notation

4. Set up the chess position:
   - Use the FEN input field for precise position setup
   - Use "Starting Position" button for standard game start
   - Use "Clear Board" for custom positions

5. Click "Create Puzzle" to save

### Managing Puzzles

- **View All Puzzles**: See all created puzzles with statistics
- **Edit Puzzles**: Click "Edit" to modify existing puzzles
- **Activate/Deactivate**: Control which puzzles are available to players
- **Delete Puzzles**: Remove puzzles (also removes all submissions)
- **Export Data**: Download puzzle and submission data as JSON

## Usage Instructions

### For Players

1. **Access PuzzleNida**: Navigate to `/puzzlenida` or click "PuzzleNida" in the navigation
2. **Filter Puzzles**: Use difficulty and theme filters to find suitable puzzles
3. **Solve Puzzles**: 
   - Study the chess position
   - Enter your solution in algebraic notation (e.g., "Nf3 d6 Bb5+")
   - Click "Submit Solution" 
4. **View Results**: Get immediate feedback and earn points for correct solutions
5. **Track Progress**: Monitor your performance on the leaderboard

### Navigation

- **Home**: `/` - Main chess arena
- **PuzzleNida**: `/puzzlenida` - Puzzle solving interface
- **Admin Panel**: `/admin` - Administrative dashboard (admin only)
- **Puzzle Management**: `/admin/puzzles` - Create and manage puzzles (admin only)
- **Admin Setup**: `/admin/setup` - One-time admin privilege setup

## Technical Details

### Database Schema

The system adds the following tables to the Convex database:

- **puzzles**: Stores puzzle data (FEN, solution, metadata)
- **puzzleSubmissions**: Tracks user solutions and results
- **profiles**: Extended with `isAdmin` flag for admin access

### API Endpoints

- `puzzle_admin:getAllPuzzles` - Get all puzzles (admin)
- `puzzle_admin:getPuzzleStats` - Get statistics (admin)
- `puzzle_admin:createPuzzle` - Create new puzzle (admin)
- `puzzle_admin:updatePuzzle` - Update existing puzzle (admin)
- `puzzle_admin:deletePuzzle` - Delete puzzle (admin)
- `puzzle_admin:getActivePuzzles` - Get active puzzles (players)
- `puzzle_admin:submitSolution` - Submit puzzle solution (players)
- `puzzle_admin:getUserSubmissions` - Get user's submissions (players)
- `puzzle_admin:getPuzzleLeaderboard` - Get leaderboard (players)

## Security

- Admin access is restricted by email address verification
- Only authenticated users can access puzzle features
- Puzzle submissions are tied to user profiles
- Admin functions require explicit admin privileges

## Support

For technical issues or questions about the PuzzleNida system:
1. Check the browser console for error messages
2. Verify your admin email is correctly configured
3. Ensure you have completed the admin setup process
4. Contact the system administrator if problems persist

---

**Note**: Remember to replace the placeholder admin email addresses with your actual ADNU email address before using the system in production.