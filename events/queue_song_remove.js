module.exports = {
  name: "Queue Song Remove",
  nameSchemes: ["Store Voice Channel As"],
  initialize(client, data, run) {
    client.on('queueSongRemove', (guild, channel) => {
        run([
          channel
        ], {guild})
    })
  }
};