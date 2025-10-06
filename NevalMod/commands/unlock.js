const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModeration } = require('../database/schema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to unlock (defaults to current channel)'))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unlocking the channel')),
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
        SendMessages: null
      });

      await logModeration(
        interaction.guildId,
        'N/A',
        interaction.user.id,
        'UNLOCK_CHANNEL',
        `Unlocked ${channel.name}: ${reason}`
      );

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🔓 Channel Unlocked')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error unlocking channel:', error);
      await interaction.reply({
        content: '❌ Failed to unlock the channel. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
