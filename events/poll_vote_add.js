module.exports = {
  name: "Poll Vote Add",
  nameSchemes: ["Store Poll As"],
  initialize(client, data, run) {
    client.on('messagePollVoteAdd', (message, author, emoji) => {
      run([
        {
          emoji: emoji.name,
          emojiID: emoji.id,
          author,
          message: message
        }
      ], {guild: message.guild})
    })
  }
};