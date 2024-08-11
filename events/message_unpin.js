module.exports = {
  name: "Message Unpin",
  nameSchemes: ["Store Message As"],
  initialize(client, data, run) {
    client.on('messageUpdate', async (message, oldMesssage) => {
      if (!oldMesssage) return;
      if (oldMesssage.pinned && !message.pinned) {
        run([
          endChannel
        ], endChannel);
      }
    })
  }
};
