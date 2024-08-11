module.exports = {
  name: "Bot Join Server",
  nameSchemes: ["Store Server As"],
  initialize(client, data, run) {
    client.on('guildCreate', (guild) => {
      run([
        guild
      ], {guild})
    })
  }
};
