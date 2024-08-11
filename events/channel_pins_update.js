module.exports = {
  name: "Channel Pins Update",
  nameSchemes: ["Store Channel As"],
  
  initialize(client, data, run) {
    client.on('channelPinsUpdate', (channel) => {
      run([
        channel
      ], channel)
    })
  }
};
