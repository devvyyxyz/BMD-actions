module.exports = {
  name: "Thread Create",
  nameSchemes: ["Store Thread As", "Store Thread Owner As"],
  initialize(client, data, run) {
    let createdThreads = {};
    client.on('threadCreate', (thread) => {
      if (!createdThreads[thread.id]) {
        createdThreads[thread.id] = true
        run([
          thread,
          thread.owner
        ], thread)
      }
    })
  }
};
