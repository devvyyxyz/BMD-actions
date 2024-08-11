module.exports = {
  name: "Channel Delete",
  nameSchemes: ["Store Channel As"],
  
  initialize(client, data, run) {
    client.on('channelDelete', (channel) => {
      run([
        channel
      ], channel)
    })
  }
};
