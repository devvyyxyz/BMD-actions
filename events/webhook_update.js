module.exports = {
  name: "Webhook Update",
  nameSchemes: ["Store Channel As"],
  
  initialize(client, data, run) {
    client.on('webhooksUpdate', async (guild, channel) => {
      if (!guild.createdAt) {
        guild = await client.rest.guilds.get(guild.id)
      }
      run([
        channel
      ], { guild })
    })
  }
};
