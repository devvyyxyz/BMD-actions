module.exports = {
  name: "Member Leave Server",
  nameSchemes: ["Store Member As"],
  async initialize(client, data, run) {
    client.on('guildMemberRemove', async (member) => {
      run([
        member
      ], member)
    })
  }
};
