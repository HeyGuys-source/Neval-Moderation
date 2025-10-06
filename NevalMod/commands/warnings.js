const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        content: '❌ You do not have permission to view warnings.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');

    try {
      const warnings = await getWarnings(user.id, interaction.guildId);

      if (warnings.length === 0) {
        return await interaction.reply({
          content: `✅ ${user.tag} has no warnings.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`⚠️ Warnings for ${user.tag}`)
        .setDescription(`Total Warnings: **${warnings.length}**`)
        .setTimestamp();

      const recentWarnings = warnings.slice(0, 10);
      recentWarnings.forEach((warning, index) => {
        const date = new Date(warning.created_at).toLocaleDateString();
        embed.addFields({
          name: `Warning #${warnings.length - index}`,
          value: `**Reason:** ${warning.reason}\n**Date:** ${date}\n**Moderator:** <@${warning.moderator_id}>`,
          inline: false
        });
      });

      if (warnings.length > 10) {
        embed.setFooter({ text: `Showing 10 most recent warnings out of ${warnings.length}` });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error fetching warnings:', error);
      await interaction.reply({
        content: '❌ Failed to fetch warnings. Please try again.',
        ephemeral: true
      });
    }
  },
};
