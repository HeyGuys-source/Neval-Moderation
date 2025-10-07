const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Send a message as the bot with advanced options')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The text to send')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('format')
        .setDescription('The format of the message')
        .addChoices(
          { name: 'Plain Text', value: 'plain' },
          { name: 'Embed', value: 'embed' },
          { name: 'Code Block', value: 'code' }
        ))
    .addStringOption(option =>
      option.setName('reply_to')
        .setDescription('Message ID to reply to (optional)'))
    .addStringOption(option =>
      option.setName('emoji_reaction')
        .setDescription('Emoji to react with (optional)')),
  async execute(interaction) {
    const ALLOWED_USERS = [
      '1412506200758685857',
      '1150880991485886504',
      '761408713872506930'
    ];

    if (!ALLOWED_USERS.includes(interaction.user.id)) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const text = interaction.options.getString('text');
    const format = interaction.options.getString('format') || 'plain';
    const replyToId = interaction.options.getString('reply_to');
    const emojiReaction = interaction.options.getString('emoji_reaction');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messageOptions = {};
      let replyOptions = null;

      if (replyToId) {
        try {
          const messageToReply = await interaction.channel.messages.fetch(replyToId);
          replyOptions = { messageReference: messageToReply.id };
        } catch (error) {
          return await interaction.editReply({
            content: '❌ Could not find the message to reply to. Please check the message ID.',
            ephemeral: true
          });
        }
      }

      if (format === 'embed') {
        const embed = new EmbedBuilder()
          .setDescription(text)
          .setColor(0x5865F2)
          .setTimestamp()
          .setFooter({ text: 'Site: Neval Moderation' });
        
        messageOptions.embeds = [embed];
      } else if (format === 'code') {
        messageOptions.content = `\`\`\`\n${text}\n\`\`\``;
      } else {
        messageOptions.content = text;
      }

      if (replyOptions) {
        messageOptions.reply = replyOptions;
      }

      const sentMessage = await interaction.channel.send(messageOptions);

      if (emojiReaction) {
        try {
          await sentMessage.react(emojiReaction);
        } catch (error) {
          console.error('Error reacting to message:', error);
        }
      }

      await interaction.editReply({
        content: '✅ Message sent successfully!',
        ephemeral: true
      });

    } catch (error) {
      console.error('Error in echo command:', error);
      await interaction.editReply({
        content: '❌ Failed to send the message. Please try again.',
        ephemeral: true
      });
    }
  },
};
