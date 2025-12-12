# Leaderboard Setup Instructions

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready

### 2. Set up the Database
1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL to create the leaderboard table

### 3. Get Your Project Credentials
1. Go to Settings > API in your Supabase dashboard
2. Copy your Project URL and anon/public key
3. Create a `.env` file in the project root (copy from `.env.example`):

```bash
# .env file (do not commit this file!)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. For production (Vercel), add these environment variables in:
   - Vercel Dashboard > Your Project > Settings > Environment Variables

### 4. Test the Setup
1. Run your game: `npm run dev`
2. Play until you get a game over
3. Wait 5 seconds for the leaderboard screen
4. Enter initials and email
5. Submit your score

## How It Works

### Game Flow
1. **Game Over**: Player dies and sees game over screen
2. **5-Second Timer**: Game waits 5 seconds
3. **Leaderboard Screen**: Shows "You Made the Leaderboard!" screen
4. **Input Collection**: Player enters 3 initials and email
5. **Score Submission**: Score is sent to Supabase database
6. **Success/Error**: Shows confirmation or error message
7. **Restart**: Returns to intro screen

### Database Schema
- **id**: Auto-incrementing primary key
- **initials**: 3-character initials (VARCHAR(3))
- **email**: Player's email address (VARCHAR(255))
- **score**: Final game score (INTEGER)
- **created_at**: Timestamp of submission

### Security
- Row Level Security (RLS) is enabled
- Anyone can submit scores (INSERT)
- Anyone can read scores (SELECT)
- No authentication required for basic leaderboard

## Customization

### Modify Timer
Change the 5-second delay in `showGameOverScreen()`:
```typescript
this.leaderboardTimer = this.time.addEvent({
  delay: 5000, // Change this value (in milliseconds)
  callback: () => this.showLeaderboardScreen(),
  callbackScope: this
})
```

### Modify Input Validation
Update validation in `submitLeaderboardScore()`:
```typescript
if (this.initialsText.length < 1 || this.emailText.length < 5) {
  // Change validation rules here
}
```

### Add Leaderboard Display
You can add a leaderboard viewing feature by using the `getLeaderboard()` function from `supabase.ts`.

## Troubleshooting

### Common Issues
1. **Supabase URL/Key**: Make sure you've updated the credentials in `src/supabase.ts`
2. **Database Schema**: Ensure you've run the SQL schema in Supabase
3. **Network Issues**: Check browser console for API errors
4. **Input Issues**: Make sure initials are 1-3 characters and email is valid

### Debug Mode
Check browser console for:
- Supabase connection errors
- API submission errors
- Input validation messages
- Game flow debug messages

