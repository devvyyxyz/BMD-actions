module.exports = {
  name: "Channel Create",
  nameSchemes: ["Store Channel As"],
  
  initialize(client, data, run) {
    client.on('channelCreate', (channel) => {
      run([
        channel
      ], channel)
    })
  }
};
