module.exports = {
  name: "Role Create",
  nameSchemes: ["Store Role As"],
  initialize(client, data, run) {
    client.on('guildRoleCreate', (role) => {
      run([
        role
      ], role)
    })
  }
};
