const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return await interaction.reply({
        content: '❌ You do not have permission to ban members.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: '❌ You cannot ban this user as they have equal or higher role than you.',
          ephemeral: true
        });
      }

      await interaction.guild.members.ban(user, {
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
        reason: `${reason} | Banned by ${interaction.user.tag}`
      });

      await logModeration(
        interaction.guildId,
        user.id,
        interaction.user.id,
        'BAN',
        reason
      );

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔨 Member Banned')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error banning member:', error);
      await interaction.reply({
        content: '❌ Failed to ban the user. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
