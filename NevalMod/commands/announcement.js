const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Send an announcement to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Announcement title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Announcement message')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send announcement (defaults to current channel)'))
    .addRoleOption(option =>
      option.setName('ping_role')
        .setDescription('Role to ping (optional)')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ You do not have permission to send announcements.',
        ephemeral: true
      });
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const pingRole = interaction.options.getRole('ping_role');

    try {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📢 ${title}`)
        .setDescription(message)
        .setFooter({ text: `Announcement by ${interaction.user.tag}` })
        .setTimestamp();

      let content = '';
      if (pingRole) {
        content = `${pingRole}`;
      }

      await channel.send({ content, embeds: [embed] });

      await interaction.reply({
        content: `✅ Announcement sent to <#${channel.id}>`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({
        content: '❌ Failed to send announcement. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
