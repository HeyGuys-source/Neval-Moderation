const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '❌ You do not have permission to manage messages.',
        ephemeral: true
      });
    }

    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      let messagesToDelete;
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id).first(amount);
      } else {
        messagesToDelete = Array.from(messages.values()).slice(0, amount);
      }

      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

      await logModeration(
        interaction.guildId,
        targetUser?.id || 'N/A',
        interaction.user.id,
        'PURGE',
        `Deleted ${deleted.size} messages in ${interaction.channel.name}`,
        `${deleted.size} messages`
      );

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🗑️ Messages Purged')
        .addFields(
          { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
          { name: 'Amount Deleted', value: `${deleted.size}`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      if (targetUser) {
        embed.addFields({ name: 'Target User', value: targetUser.tag });
      }

      await interaction.editReply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error purging messages:', error);
      await interaction.editReply({
        content: '❌ Failed to purge messages. Messages older than 14 days cannot be bulk deleted.',
        ephemeral: true
      });
    }
  },
};
