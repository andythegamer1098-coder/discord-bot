const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder } = require('discord.js');
const { ownerId } = require('../config.json');

const whitelistDataPath = path.join(__dirname, '..', 'data', 'whitelisted.json');
// Load or initialize whitelist data
let whitelistData = {};
try {
  if (fs.existsSync(whitelistDataPath)) {
    whitelistData = JSON.parse(fs.readFileSync(whitelistDataPath));
  }
} catch (err) {
  console.error('Error reading whitelist data:', err);
}

function saveWhitelist() {
  fs.writeFileSync(whitelistDataPath, JSON.stringify(whitelistData, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
    else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'whitelistModal') {
        const robloxUsername = interaction.fields.getTextInputValue('robloxUsername').trim();
        const discordUsername = interaction.fields.getTextInputValue('discordUsername').trim();

        await interaction.reply({ content: '✅ Request submitted! Please wait for approval. If rejected, you’ll be DM’d with the reason.', ephemeral: true });

        const owner = await client.users.fetch(ownerId);

        if (!owner) {
          return; // Owner not found
        }

        // Prepare dropdown and buttons
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`whitelistReason_${interaction.user.id}`)
          .setPlaceholder('Select whitelist reason or category')
          .addOptions([
            { label: 'Game Tester', value: 'game_tester' },
            { label: 'Content Creator', value: 'content_creator' },
            { label: 'Developer', value: 'developer' },
            { label: 'Other', value: 'other' }
          ]);

        const buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`approve_${interaction.user.id}`)
              .setLabel('Approve ✅')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject_${interaction.user.id}`)
              .setLabel('Reject ❌')
              .setStyle(ButtonStyle.Danger)
          );

        // Send DM to owner
        const embed = {
          title: 'New Whitelist Request',
          color: 0x00FF00,
          fields: [
            { name: 'Roblox Username', value: robloxUsername, inline: true },
            { name: 'Discord Username', value: discordUsername, inline: true },
            { name: 'Requester', value: `${interaction.user.tag} (${interaction.user.id})` }
          ],
          timestamp: new Date()
        };

        try {
          await owner.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu), buttons] });
        } catch (e) {
          console.error('Failed to DM owner whitelist request:', e);
        }

        // Store pending request in memory for reference on buttons (optional).
        if (!client.pendingWhitelists) client.pendingWhitelists = new Map();
        client.pendingWhitelists.set(interaction.user.id, {
          robloxUsername,
          discordUsername,
          userId: interaction.user.id,
          approved: false
        });

      } else if (interaction.customId.startsWith('rejectReasonModal_')) {
        const userId = interaction.customId.split('_')[1];
        const reason = interaction.fields.getTextInputValue('rejectReason');
        const pending = client.pendingWhitelists?.get(userId);

        if (!pending) {
          await interaction.reply({ content: 'Related whitelist request not found.', ephemeral: true });
          return;
        }

        // DM user rejected message
        try {
          const user = await client.users.fetch(userId);
          await user.send(`❌ Your whitelist request was rejected.\nReason: ${reason}`);
        } catch (e) {
          console.error('Failed to DM user rejection reason:', e);
        }

        // Inform owner of rejection complete
        await interaction.reply({ content: 'Rejection reason sent and whitelist request marked as rejected.', ephemeral: true });

        client.pendingWhitelists.delete(userId);

      } else if (interaction.customId === 'findModal') {
        if (interaction.user.id !== ownerId) {
          await interaction.reply({ content: 'You do not have permission to use this.', ephemeral: true });
          return;
        }
        const assetId = interaction.fields.getTextInputValue('assetId');
        const dlLink = `https://www.roblox.com/library/${assetId}`;

        try {
          await interaction.reply({ content: `Download link: ${dlLink}`, ephemeral: true });
          await interaction.user.send(`Here is the download link for asset ID \`${assetId}\`:\n${dlLink}`);
        } catch (e) {
          console.error('Failed sending DM for find command:', e);
          await interaction.reply({ content: 'Failed to send DM with the link.', ephemeral: true });
        }

      }
    }
    else if (interaction.isButton()) {
      // Buttons are approve/reject/whitelisted buttons

      let [action, userId] = interaction.customId.split('_');
      if (!userId) return;

      if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: 'Only the bot owner can use these buttons.', ephemeral: true });
        return;
      }

      const pending = client.pendingWhitelists?.get(userId);
      if (!pending) {
        await interaction.reply({ content: 'No pending whitelist request found for this user.', ephemeral: true });
        return;
      }

      if (action === 'approve') {
        // Mark approved in whitelistData
        whitelistData[userId] = {
          robloxUsername: pending.robloxUsername,
          discordUsername: pending.discordUsername,
          approvedAt: new Date().toISOString()
        };
        saveWhitelist();

        // DM user approved message
        try {
          const user = await client.users.fetch(userId);
          await user.send('🎉 You’ve been approved and are now in the whitelist system!');
        } catch (e) {
          console.error('Failed to send approval DM:', e);
        }

        // Update owner interaction
        await interaction.update({ content: `Approved whitelist request for user <@${userId}>.`, components: [] });

        client.pendingWhitelists.delete(userId);

      } else if (action === 'reject') {
        // Show modal to input rejection reason
        const modal = new ModalBuilder()
          .setCustomId(`rejectReasonModal_${userId}`)
          .setTitle('Rejection Reason');

        const reasonInput = new TextInputBuilder()
          .setCustomId('rejectReason')
          .setLabel('Reason for rejection')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);

      } else if (action === 'whitelisted') {
        try {
          const user = await client.users.fetch(userId);
          await user.send('✅ You have officially been whitelisted!');
          await interaction.reply({ content: `Confirmation sent to <@${userId}>.`, ephemeral: true });
        } catch (e) {
          console.error('Failed to send whitelisted confirmation:', e);
          await interaction.reply({ content: 'Failed to send confirmation DM.', ephemeral: true });
        }
      }
    }
  }
};
