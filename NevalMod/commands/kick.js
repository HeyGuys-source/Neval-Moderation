const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return await interaction.reply({
        content: '❌ You do not have permission to kick members.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: '❌ You cannot kick this user as they have equal or higher role than you.',
          ephemeral: true
        });
      }

      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      await logModeration(
        interaction.guildId,
        user.id,
        interaction.user.id,
        'KICK',
        reason
      );

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('👢 Member Kicked')
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error kicking member:', error);
      await interaction.reply({
        content: '❌ Failed to kick the user. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
