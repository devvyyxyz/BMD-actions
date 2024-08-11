module.exports = {
  name: "Track End",
  nameSchemes: ["Store Voice Channel As"],
  initialize(client, data, run) {
    client.on('trackEnd', (guild, channel) => {
        run([
          channel
        ], {guild})
    })
  }
};