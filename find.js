const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { ownerId } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('find')
    .setDescription('Owner-only command to find Roblox assets'),
  
  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('findModal')
      .setTitle('Find Roblox Asset');

    const assetIdInput = new TextInputBuilder()
      .setCustomId('assetId')
      .setLabel('Roblox Asset ID')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(assetIdInput));
    await interaction.showModal(modal);
  }
};
