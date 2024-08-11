const { Client } = require("oceanic.js");

module.exports = {
  name: "Member Update",
  nameSchemes: ["Store Member As", "Store Old Member As"],
  
  /**
   * @param {Client} client
   * @param {*} data
   * @param {*} run
   */
  initialize(client, data, run) {
    client.on('guildMemberUpdate', async (member, oldJSONMember) => {
      const {Member} = require('oceanic.js');
      let old = new Member(oldJSONMember);
      run([
        member,
        old
      ], member)
    })
  }
};
