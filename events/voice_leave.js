module.exports = {
  name: "Member Leave Voice Channel",
  nameSchemes: ["Store Member As", "Store Voice Channel As"],
  async initialize(client, data, run) {
    client.on('voiceChannelLeave', async (member, channel) => {
      let chnl = await client.rest.channels.get(channel.id);
        run([
          member,
          chnl
        ], member)
    })
  }
};