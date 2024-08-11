module.exports = {
  name: "Reaction Remove",
  nameSchemes: ["Store Reaction As"],
  initialize(client, data, run) {
    client.on('messageReactionRemove', async (reactionMessage, author, emoji) => {
      if (!reactionMessage.author) {
        reactionMessage = await (client.getChannel(reactionMessage.channelID) || await client.rest.channels.get(reactionMessage.channelID)).getMessage(reactionMessage.id)
      }

      run([
        {
          emoji: emoji.name,
          emojiID: emoji.id,
          author,
          message: reactionMessage
        }
      ], { guild: reactionMessage.guild })
    })
  }
}
