const { pool } = require('./db');

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS warnings (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        guild_id VARCHAR(255) NOT NULL,
        moderator_id VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id SERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        moderator_id VARCHAR(255) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        reason TEXT,
        duration VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id SERIAL PRIMARY KEY,
        guild_id VARCHAR(255) UNIQUE NOT NULL,
        config_key VARCHAR(255) NOT NULL,
        config_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_reactions (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(255) UNIQUE NOT NULL,
        channel_id VARCHAR(255) NOT NULL,
        thumbs_up_count INTEGER DEFAULT 0,
        star_added BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function addWarning(userId, guildId, moderatorId, reason) {
  const result = await pool.query(
    'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, guildId, moderatorId, reason]
  );
  return result.rows[0];
}

async function getWarnings(userId, guildId) {
  const result = await pool.query(
    'SELECT * FROM warnings WHERE user_id = $1 AND guild_id = $2 ORDER BY created_at DESC',
    [userId, guildId]
  );
  return result.rows;
}

async function logModeration(guildId, userId, moderatorId, actionType, reason, duration = null) {
  const result = await pool.query(
    'INSERT INTO moderation_logs (guild_id, user_id, moderator_id, action_type, reason, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [guildId, userId, moderatorId, actionType, reason, duration]
  );
  return result.rows[0];
}

async function updateForumReaction(messageId, channelId, thumbsUpCount, starAdded) {
  const result = await pool.query(
    `INSERT INTO forum_reactions (message_id, channel_id, thumbs_up_count, star_added)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (message_id)
     DO UPDATE SET thumbs_up_count = $3, star_added = $4
     RETURNING *`,
    [messageId, channelId, thumbsUpCount, starAdded]
  );
  return result.rows[0];
}

async function getForumReaction(messageId) {
  const result = await pool.query(
    'SELECT * FROM forum_reactions WHERE message_id = $1',
    [messageId]
  );
  return result.rows[0];
}

module.exports = {
  initializeDatabase,
  addWarning,
  getWarnings,
  logModeration,
  updateForumReaction,
  getForumReaction
};
