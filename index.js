const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

// Create client with necessary intents and partials for DMs
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

// Command collection
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

// Map to store snipes per channel (deleted messages)
client.snipes = new Map();

client.login(token);
