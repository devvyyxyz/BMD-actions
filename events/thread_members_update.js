module.exports = {
  name: "Thread Members Update",
  nameSchemes: ["Store Thread As", "Store Thread Added Members List As", "Store Thread Removed Members List As"],
  initialize(client, data, run) {
    client.on('threadMembersUpdate', (thread, addedMembers, removedMembers) => {
      run([
        thread,
        addedMembers,
        removedMembers
      ], thread)
    })
  }
};