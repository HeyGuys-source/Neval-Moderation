const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to add the role to')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove')
            .setRequired(true))),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({
        content: '❌ You do not have permission to manage roles.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');

    try {
      const member = await interaction.guild.members.fetch(user.id);

      if (role.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: '❌ You cannot manage this role as it is equal to or higher than your highest role.',
          ephemeral: true
        });
      }

      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({
          content: '❌ I cannot manage this role as it is equal to or higher than my highest role.',
          ephemeral: true
        });
      }

      if (subcommand === 'add') {
        if (member.roles.cache.has(role.id)) {
          return await interaction.reply({
            content: `❌ ${user.tag} already has the ${role.name} role.`,
            ephemeral: true
          });
        }

        await member.roles.add(role);

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Role Added')
          .addFields(
            { name: 'User', value: user.tag, inline: true },
            { name: 'Role', value: role.name, inline: true },
            { name: 'Added by', value: interaction.user.tag, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });

      } else if (subcommand === 'remove') {
        if (!member.roles.cache.has(role.id)) {
          return await interaction.reply({
            content: `❌ ${user.tag} does not have the ${role.name} role.`,
            ephemeral: true
          });
        }

        await member.roles.remove(role);

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🗑️ Role Removed')
          .addFields(
            { name: 'User', value: user.tag, inline: true },
            { name: 'Role', value: role.name, inline: true },
            { name: 'Removed by', value: interaction.user.tag, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error managing role:', error);
      await interaction.reply({
        content: '❌ Failed to manage the role. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  },
};
