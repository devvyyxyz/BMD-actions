module.exports = {
  name: "Bot Leave Server",
  nameSchemes: ["Store Server As"],
  initialize(client, data, run) {
    client.on('guildDelete', (guild) => {
      run([
        guild
      ], {guild})
    })
  }
};
