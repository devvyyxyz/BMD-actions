module.exports = {
  name: "Message Update",
  nameSchemes: ["Store Old Message As", "Store New Message As"],
  initialize(client, data, run) {
    client.on('messageUpdate', (updated, old) => {
      run([
        old,
        updated
      ], updated)
    })
  }
};