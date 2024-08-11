module.exports = {
  name: "Queue Song Add",
  nameSchemes: ["Store Voice Channel As", "Store Track As"],
  initialize(client, data, run) {
    client.on('queueSongAdd', (guild, channel, track) => {
        run([
          channel,
          track
        ], {guild})
    })
  }
};