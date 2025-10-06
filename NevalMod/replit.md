# Site: Neval Moderation - Discord Bot

## Project Overview
An advanced Discord moderation bot with comprehensive slash commands, automatic forum reactions, and persistent PostgreSQL database storage. Built to run continuously on Render.com with health check monitoring.

## Bot Name
**Site: Neval Moderation**

## Current Status
✅ All features implemented and ready for deployment
⚠️ Requires Discord Developer Portal configuration before first run

## Key Features

### Special Administrator Commands
1. **`/echo`** - Advanced message sending with:
   - Optional reply to specific messages
   - Format options: plain text, embed, or code block
   - Custom emoji reactions
   - Admin permission bypass (works regardless of user permissions)

2. **`/ssu3`** - Site Reval session startup announcement
   - Pre-configured message format
   - Includes role mention for `1412921434522521712`

3. **Auto-Forum Reactions** - Channel ID: `1412524146163847269`
   - Automatically adds thumbs up emoji: `<:thumbsup:1419179161792151612>`
   - Automatically adds thumbs down emoji: `<:thumbsdown:1419179242071134339>`
   - Adds star emoji `⭐` when thumbs up reaches 5+

### Moderation Commands (14 total)
- `/ban` - Ban members with optional message deletion
- `/kick` - Kick members from server
- `/timeout` - Timeout members (1-40320 minutes)
- `/warn` - Issue warnings with database tracking
- `/warnings` - View user warning history
- `/purge` - Bulk delete messages (1-100)
- `/lock` / `/unlock` - Lock/unlock channels

### Utility Commands
- `/slowmode` - Set channel slowmode (0-21600 seconds)
- `/announcement` - Send formatted announcements with role pings
- `/role` - Add/remove roles from users
- `/serverinfo` - Display server statistics

## Database Schema
PostgreSQL database with 4 tables:
- `warnings` - User warnings with moderator tracking
- `moderation_logs` - Complete audit log of all moderation actions
- `bot_config` - Guild-specific configuration
- `forum_reactions` - Track forum post reactions and star status

## Health Check System
- Express server on port 3000
- Endpoints: `/`, `/health`, `/ping`
- 5-minute heartbeat monitoring
- Automatic database initialization
- Error handling and logging

## Architecture
```
├── bot.js                    # Main bot file with event handlers
├── commands/                 # Slash command modules (14 commands)
│   ├── echo.js
│   ├── ssu3.js
│   ├── ban.js, kick.js, timeout.js, warn.js, warnings.js
│   ├── purge.js, lock.js, unlock.js
│   ├── slowmode.js, announcement.js, role.js, serverinfo.js
├── database/                 # Database layer
│   ├── db.js                # PostgreSQL connection pool
│   └── schema.js            # Schema initialization and queries
├── deploy-commands.js       # Command deployment script
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variable template
└── DISCORD_SETUP_GUIDE.txt  # Complete setup instructions
```

## Environment Variables Required

### For Replit:
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Application client ID
- `DATABASE_URL` - PostgreSQL connection (auto-provided)
- `PORT` - Server port (default: 3000)

### For Render.com Deployment:
All of the above, plus:
- `NODE_ENV` - Set to "production"

**Recommended Port for Render.com:** 3000 (not 8080)

## Setup Instructions

### Before First Run:
1. **Enable Privileged Intents** in Discord Developer Portal:
   - Go to Bot tab
   - Enable: Presence Intent, Server Members Intent, Message Content Intent
   - Save changes and wait 1-2 minutes

2. **Set Environment Variables** (already done in Replit):
   - DISCORD_TOKEN
   - DISCORD_CLIENT_ID

3. **Deploy Commands** (after bot runs successfully):
   ```bash
   npm run deploy
   ```

### Invite Bot to Server:
Use OAuth2 URL Generator with:
- Scopes: `bot`, `applications.commands`
- Permissions: Administrator (or specific moderation permissions)

## Running the Bot

### Start Bot:
```bash
npm start
```

### Deploy Commands:
```bash
npm run deploy
```

## Deployment to Render.com

### Build Command:
```
npm install
```

### Start Command:
```
npm start
```

### Port:
```
3000
```

### Health Check Endpoint:
```
https://your-app.onrender.com/health
```

## Keep-Alive Features
- Built-in Express server for health checks
- Heartbeat logging every 5 minutes
- Automatic reconnection on connection loss
- Error handling to prevent crashes
- Process-level error handlers

## Recent Changes
- October 6, 2025: Initial implementation complete
- Fixed Discord.js v14 PermissionFlagsBits typo
- Configured PostgreSQL database with 4 tables
- Implemented all 14 slash commands
- Added forum auto-reaction system
- Created health check server on port 3000

## User Preferences
- Advanced moderation features required
- Persistent database storage (no data loss)
- Continuous running capability for Render.com
- Custom emojis for forum reactions
- Specific role mentions in announcements

## Notes
- The `/echo` command bypasses normal permission checks for administrators
- Forum reactions only work in channel ID `1412524146163847269`
- Star emoji is added automatically at 5+ thumbs up reactions
- All moderation actions are logged in the database
- The bot will run indefinitely with health check monitoring
