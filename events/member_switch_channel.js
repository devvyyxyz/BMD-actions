module.exports = {
  name: "Member Move Voice Channel",
  nameSchemes: ["Store Member As", "Store Old Channel As", "Store New Channel As"],
  async initialize(client, data, run) {
    client.on('voiceChannelSwitch', async (member, oldChannel, channel) => {
      let channel1 = client.getChannel(channel.id) || (await client.rest.channels.get(channel.id));
      let channel2 = client.getChannel(oldChannel.id) || (await client.rest.channels.get(oldChannel.id));
      let user = member.user;
      user.member = member;
      run([
        user,
        channel1,
        channel2
      ], {guild: member.guild})
    })
  }
}
