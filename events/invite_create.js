module.exports = {
  name: "Invite Create",
  nameSchemes: ["Store Invite As"],
  initialize(client, data, run) {
    client.on('inviteCreate', (invite) => {
      run([
        invite
      ], invite)
    })
  }
};
