module.exports = {
  name: "Queue End",
  nameSchemes: ["Store Voice Channel As"],
  initialize(client, data, run) {
    client.on('queueEnd', (guild, channel) => {
        run([
          channel
        ], {guild})
    })
  }
};