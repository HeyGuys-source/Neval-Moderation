const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to lock (defaults to current channel)'))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for locking the channel')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        content: '❌ You do not have permission to manage channels.',
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      });

      await logModeration(
        interaction.guildId,
        'N/A',
        interaction.user.id,
        'LOCK_CHANNEL',
        `Locked ${channel.name}: ${reason}`
      );

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔒 Channel Locked')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error locking channel:', error);
      await interaction.reply({
        content: '❌ Failed to lock the channel. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
