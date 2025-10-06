const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarning, getWarnings, logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        content: '❌ You do not have permission to warn members.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    try {
      await addWarning(user.id, interaction.guildId, interaction.user.id, reason);
      
      await logModeration(
        interaction.guildId,
        user.id,
        interaction.user.id,
        'WARN',
        reason
      );

      const warnings = await getWarnings(user.id, interaction.guildId);
      const warningCount = warnings.length;

      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('⚠️ Member Warned')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Total Warnings', value: `${warningCount}`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      try {
        await user.send({
          content: `You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`
        });
      } catch (error) {
        console.log('Could not DM user about warning');
      }

    } catch (error) {
      console.error('Error warning member:', error);
      await interaction.reply({
        content: '❌ Failed to warn the user. Please try again.',
        ephemeral: true
      });
    }
  },
};
