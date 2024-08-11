module.exports = {
  name: "Button Interaction",
  nameSchemes: ["Store Button Interaction As", "Store Button Custom ID As", "Store Button Message As"],
  initialize(client, data, run) {
    client.on('interactionCreate', (interaction) => {
      if (interaction.type != 3 || interaction.data.values) return;

      run([
        interaction,
        interaction.data.customID,
        interaction.message
      ], interaction)
    })
  }
};