const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssu3')
    .setDescription('Send Site Reval session startup announcement')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const message = `**Site: Reval | Session Start up**

A new session is starting, if you'd like to join click the green button near the server name to play. The mode chosen for this SSU is: **Serious**. Remember to follow all regulations along with Roblox TOS during this SSU.

**Server name:** 🎃 | Site Reval | Serious 

If you'd like your mod permissions please go to ⁠📘┃mod-request and fill out the form. Thank you for joining! <@&1412921434522521712>`;

    await interaction.reply({ content: message });
  },
};
