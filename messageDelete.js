module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.partial && message.content) {
      client.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author ? message.author.tag : 'Unknown',
        time: Date.now()
      });
    }
  }
};
