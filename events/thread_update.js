module.exports = {
  name: "Thread Update",
  nameSchemes: ["Store Thread Before Update As", "Store Thread After Update As"],
  initialize(client, data, run) {
    client.on('threadUpdate', (updated, old) => {
        deletedThreads[thread.id] = true
        run([
          old,
          updated
        ], thread)
    })
  }
};