module.exports = {
  name: "Invite Delete",
  nameSchemes: ["Store Invite As"],
  initialize(client, data, run) {
    client.on('inviteDelete', (invite) => {
      run([
        invite
      ], invite)
    })
  }
};
