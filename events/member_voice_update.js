module.exports = {
  name: "Member Voice Update",
  nameSchemes: ["Store Current Member As"],
  async initialize(client, data, run) {
    client.on('voiceStateUpdate', (member) => {
      let user = member.user;
      user.member = member;
      run([
        user
      ], {guild: member.guild})
    })
  }
}
