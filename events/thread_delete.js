module.exports = {
  name: "Thread Delete",
  nameSchemes: ["Store Thread As", "Store Thread Owner As"],
  initialize(client, data, run) {
    let deletedThreads = {};
    client.on('threadDelete', (thread) => {
      if (!deletedThreads[thread.id]) {
        deletedThreads[thread.id] = true
        run([
          thread,
          thread.owner
        ], thread)
      }
    })
  }
};
