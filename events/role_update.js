const oceanic = require('oceanic.js');

module.exports = {
  name: "Role Update",
  nameSchemes: ["Store Role Before Update As", "Store Role After Update As"],
  initialize(client, data, run) {
    client.on('guildRoleUpdate', /**
       * @param {oceanic.Role} updated
       * @param {oceanic.JSONRole} old */
      (updated, old) => {
        old.permissions = old.permissions.allow.toString()
        run([
          (new oceanic.Role(old, old.guildID, client)),
          updated
        ], updated)
      })
  }
};