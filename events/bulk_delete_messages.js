module.exports = {
  name: "Messages Bulk Delete",
  nameSchemes: ["Store Deleted Messages List As"],
  initialize(client, data, run) {
    client.on('messageDeleteBulk', (messages) => {
      run(messages, messages)
    })
  }
};