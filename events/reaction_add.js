module.exports = {
  name: "Reaction Add",
  nameSchemes: ["Store Reaction As"],
  initialize(client, data, run) {
    client.on('messageReactionAdd', async (reactionMessage, author, emoji) => {
      if (!reactionMessage.author) {
        reactionMessage = await (client.getChannel(reactionMessage.channelID) || await client.rest.channels.get(reactionMessage.channelID)).getMessage(reactionMessage.id)
      }
      run([
        {
          emoji: emoji.emoji.name,
          emojiID: emoji.emoji.id,
          author,
          message: reactionMessage
        }
      ], { guild: reactionMessage.guild })
    })
  }
};