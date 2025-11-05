const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Submit a whitelist request'),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('whitelistModal')
      .setTitle('Whitelist Request');

    const robloxUsernameInput = new TextInputBuilder()
      .setCustomId('robloxUsername')
      .setLabel('Roblox Username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const discordUsernameInput = new TextInputBuilder()
      .setCustomId('discordUsername')
      .setLabel('Discord Username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(robloxUsernameInput),
      new ActionRowBuilder().addComponents(discordUsernameInput)
    );

    await interaction.showModal(modal);
  }
};
