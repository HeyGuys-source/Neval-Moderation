const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Slowmode duration in seconds (0 to disable)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to set slowmode (defaults to current channel)')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        content: '❌ You do not have permission to manage channels.',
        ephemeral: true
      });
    }

    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⏱️ Slowmode Updated')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Duration', value: seconds === 0 ? 'Disabled' : `${seconds} seconds`, inline: true },
          { name: 'Set by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error setting slowmode:', error);
      await interaction.reply({
        content: '❌ Failed to set slowmode. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
