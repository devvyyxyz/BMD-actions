module.exports = {
  name: "Message Create",
  nameSchemes: ["Store Message As"],
  initialize(client, data, run) {
    client.on('messageCreate', (message) => {
      run([
        message
      ], message)
    })
  }
};
