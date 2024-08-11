module.exports = {
  name: "Role Delete",
  nameSchemes: ["Store Role As"],
  initialize(client, data, run) {
    client.on('guildRoleDelete', (role) => {
      run([
        role
      ], role)
    })
  }
};
