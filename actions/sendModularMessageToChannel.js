module.exports = {
  category: "Modularity",
  data: { name: "Send Modular Message To Channel" },
  UI: [
    {
      element: "var",
      storeAs: "message",
      name: "Modular Message"
    },
    "-",
    {
      element: "channel",
      storeAs: "channel",
      name: "Send To"
    },
    "-",
    {
      element: "toggle",
      storeAs: "mentions",
      name: "Allow Mentions"
    },
    "-",
    {
      element: "store",
      storeAs: "store"
    },
  ],

  subtitle: (data, constants) => {
    return `Store As: ${constants.variable(data.store)}`
  },

  async run(values, _msg, client, bridge) {
    let channel = await bridge.getChannel(values.channel);
    let message = bridge.get(values.message);

    let msg = await channel.createMessage(message.raw);
    bridge.store(values.store, msg);

    bridge.data.interactionHandlers[msg.id] = {}

    message.components.forEach(component => {
      component.run(msg);
    })
  },
};