const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logrank')
    .setDescription('Logs command usage with Roblox username and Adonis rank silently'),

  async execute(interaction) {
    try {
      const discordUserId = interaction.user.id;

      // Replace these with your real linkage/API
      const robloxUsername = await getLinkedRobloxUsername(discordUserId);
      const adonisRank = await getAdonisRank(robloxUsername);

      // Log the command, user, and rank silently (console/server log or your preferred datastore)
      console.log(`[LOG] Command /logrank used by Discord: ${interaction.user.tag} (ID: ${discordUserId}), Roblox: ${robloxUsername}, Rank: ${adonisRank}`);

      // Respond silently to user (ephemeral)
      await interaction.reply({ content: 'Command executed.', ephemeral: true });

    } catch (error) {
      console.error('Failed to log rank command:', error);
      await interaction.reply({ content: 'An error occurred.', ephemeral: true });
    }
  }
};

// Placeholder functions for your linkage system; implement these properly
async function getLinkedRobloxUsername(discordId) {
  // query your DB or API to get Roblox username linked to this Discord ID
  return 'PlayerRobloxName';
}

async function getAdonisRank(robloxUsername) {
  // query your Adonis Ranks API or database to get user rank based on robloxUsername
  return 'Admin';
}
