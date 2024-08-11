module.exports = {
  name: "Track Start",
  nameSchemes: ["Store Voice Channel As", "Store Track As"],
  initialize(client, data, run) {
    client.on('trackStart', (guild, channel, track) => {
        run([
          channel,
          track
        ], {guild})
    })
  }
};