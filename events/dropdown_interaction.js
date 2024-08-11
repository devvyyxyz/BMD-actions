module.exports = {
  name: "Select Menu Interaction",
  nameSchemes: ["Store Menu Interaction As", "Store Menu Custom ID As", "Store Choices Values List As", "Store Interaction Message As"],
  initialize(client, data, run) {
    client.on('interactionCreate', (interaction) => {
      if (interaction.type != 3 || !interaction.data.values) return;

      run([
        interaction,
        interaction.data.customID,
        interaction.data.values.raw,
        interaction.message
      ], interaction)
    })
  }
};