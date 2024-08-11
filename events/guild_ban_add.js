module.exports = {
  name: "Member Ban",
  nameSchemes: ["Store Guild As", "Store Member As"],
  initialize(client, data, run) {
    client.on('guildBanAdd', async (guild, member) => {
      if (!guild.createdAt) {
        guild = await client.rest.guilds.get(guild.id)
      }

      run([
        member.guild,
        member
      ], { guild })
    })
  }
};
