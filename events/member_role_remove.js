module.exports = {
    name: "Member Role Remove",
    nameSchemes: ["Store Member As", "Store Role As"],
    initialize(client, data, run) {
      client.on('guildMemberUpdate', (member, oldMember) => {
        if (oldMember && member.roles.length < oldMember.roles.length) {
            let roleID = oldMember.roles.find(r => !member.roles.includes(r));
            let role = member.guild.roles.get(roleID);

            run([
                member,
                role
            ], { guild: member.guild })
        }
      })
    }
  };
  