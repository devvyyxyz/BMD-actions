module.exports = {
  name: "Message Delete",
  nameSchemes: ["Store Message As"],
  initialize(client, data, run) {
    client.on('messageDelete', async (message) => {
      run([
        message
      ], message)
    })
  }
};
