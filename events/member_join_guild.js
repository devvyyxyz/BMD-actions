module.exports = {
  name: "Member Join Server",
  nameSchemes: ["Store Member As"],
  async initialize(client, data, run) {
    client.on('guildMemberAdd', async (member) => {
      run([
        member
      ], member)
    })
  }
};