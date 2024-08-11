module.exports = {
    name: "Member Role Add",
    nameSchemes: ["Store Member As", "Store Role As"],
    initialize(client, data, run) {
      client.on('guildMemberUpdate', (member, oldMember) => {
        if (oldMember && member.roles.length > oldMember.roles.length) {
            let roleID = member.roles.find(r => !oldMember.roles.includes(r));
            let role = member.guild.roles.get(roleID);

            run([
                member,
                role
            ], { guild: member.guild })
        }
      })
    }
  };
  