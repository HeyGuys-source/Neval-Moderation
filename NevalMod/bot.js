require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { initializeDatabase, updateForumReaction, getForumReaction } = require('./database/schema');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
}

const FORUM_CHANNEL_ID = '1424918996519620769';
const THUMBS_UP_EMOJI = '<:tick:1424921287788068895>';
const THUMBS_DOWN_EMOJI = '<:no:1424921340997009479>';
const STAR_EMOJI = '<:star:1424921415131467846>';
const THUMBS_UP_THRESHOLD = 5;

client.once('clientReady', async () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Site: Neval Moderation Bot Ready!   ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🌐 Serving ${client.guilds.cache.size} guild(s)`);
  console.log(`📝 Loaded ${client.commands.size} command(s)`);
  
  client.user.setPresence({
    activities: [{ name: 'Provision 12: Akai Moderation', type: ActivityType.Watching }],
    status: 'online',
  });

  try {
    await initializeDatabase();
    console.log('✅ Database initialized and ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }

  startHealthCheckServer();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing ${interaction.commandName}:`, error);
    const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.on('threadCreate', async thread => {
  try {
    if (thread.parentId === FORUM_CHANNEL_ID) {
      console.log(`📌 New thread detected in forum: ${thread.name}`);
      
      const starterMessage = await thread.fetchStarterMessage();
      
      if (starterMessage) {
        await starterMessage.react(THUMBS_UP_EMOJI);
        await starterMessage.react(THUMBS_DOWN_EMOJI);
        console.log(`✅ Auto-reacted to thread: ${thread.name}`);
        
        await updateForumReaction(starterMessage.id, thread.id, 0, false);
      }
    }
  } catch (error) {
    console.error('❌ Error auto-reacting to thread:', error);
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    if (user.bot) return;
    
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    const message = reaction.message;
    
    if (message.channel.parentId === FORUM_CHANNEL_ID && message.channel.isThread()) {
      const starterMessage = await message.channel.fetchStarterMessage();
      
      if (starterMessage && message.id === starterMessage.id) {
        if (reaction.emoji.toString() === THUMBS_UP_EMOJI) {
          const thumbsUpCount = reaction.count;
          const reactionData = await getForumReaction(message.id);
          
          if (thumbsUpCount >= THUMBS_UP_THRESHOLD && (!reactionData || !reactionData.star_added)) {
            await message.react(STAR_EMOJI);
            await updateForumReaction(message.id, message.channel.id, thumbsUpCount, true);
            console.log(`⭐ Added star emoji to thread: ${message.channel.name} (${thumbsUpCount} thumbs up)`);
          } else {
            await updateForumReaction(message.id, message.channel.id, thumbsUpCount, reactionData?.star_added || false);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling reaction add:', error);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  try {
    if (user.bot) return;
    
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    const message = reaction.message;
    
    if (message.channel.parentId === FORUM_CHANNEL_ID && message.channel.isThread()) {
      const starterMessage = await message.channel.fetchStarterMessage();
      
      if (starterMessage && message.id === starterMessage.id) {
        if (reaction.emoji.toString() === THUMBS_UP_EMOJI) {
          const thumbsUpCount = reaction.count;
          const reactionData = await getForumReaction(message.id);
          
          await updateForumReaction(message.id, message.channel.id, thumbsUpCount, reactionData?.star_added || false);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling reaction remove:', error);
  }
});

client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

client.on('warn', info => {
  console.warn('⚠️  Discord client warning:', info);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

function startHealthCheckServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (req, res) => {
    res.status(200).send('Bot is running!');
  });

  app.get('/health', (req, res) => {
    const healthStatus = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      bot: {
        ready: client.isReady(),
        user: client.user?.tag || 'Not logged in',
        guilds: client.guilds.cache.size,
        ping: client.ws.ping,
      },
    };
    res.status(200).json(healthStatus);
  });

  app.get('/ping', (req, res) => {
    res.status(200).send('pong');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
    console.log(`🔍 Health endpoint: http://localhost:${PORT}/health`);
  });

  setInterval(() => {
    if (client.isReady()) {
      console.log(`💓 Heartbeat: Bot is alive | Ping: ${client.ws.ping}ms | Uptime: ${Math.floor(process.uptime())}s`);
    }
  }, 300000);
}

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set in environment variables!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
