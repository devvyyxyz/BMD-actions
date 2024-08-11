module.exports = {
  name: "Channel Update",
  nameSchemes: ["Store Channel Before Update As", "Store Channel After Update As"],
  initialize(client, data, run) {
    client.on('channelUpdate', (updated, old) => {
      run([
        old,
        updated
      ], updated)
    })
  }
};
