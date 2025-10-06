const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        content: '❌ You do not have permission to timeout members.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: '❌ You cannot timeout this user as they have equal or higher role than you.',
          ephemeral: true
        });
      }

      const durationMs = duration * 60 * 1000;
      await member.timeout(durationMs, `${reason} | Timed out by ${interaction.user.tag}`);

      await logModeration(
        interaction.guildId,
        user.id,
        interaction.user.id,
        'TIMEOUT',
        reason,
        `${duration} minutes`
      );

      const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle('⏱️ Member Timed Out')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Duration', value: `${duration} minutes`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error timing out member:', error);
      await interaction.reply({
        content: '❌ Failed to timeout the user. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
