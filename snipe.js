const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Retrieve the last deleted message in this channel'),

  async execute(interaction) {
    const snipes = interaction.client.snipes;
    const snipe = snipes.get(interaction.channel.id);

    if (!snipe) {
      return interaction.reply({ content: '⚠️ There’s nothing to snipe right now.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('💬 Sniped Message')
      .addFields(
        { name: 'User', value: snipe.author, inline: true },
        { name: 'Time', value: `<t:${Math.floor(snipe.time / 1000)}:R>`, inline: true },
        { name: 'Message', value: snipe.content || '*Empty message*' }
      );

    await interaction.reply({ embeds: [embed] });
  }
};
