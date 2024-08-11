module.exports = {
  category: "Modularity",
  data: { name: "Send Modular Message To Interaction" },
  UI: [
    {
      element: "var",
      storeAs: "message",
      name: "Modular Message"
    },
    "-",
    {
      element: "interaction",
      storeAs: "interaction",
      name: "Send To"
    },
    {
      element: "toggleGroup",
      storeAs: ["replyToInteraction", "mentions"],
      prefer: 0,
      nameSchemes: ["If Possible, Send As Interaction Reply", "Allow Mentions"]
    },
    {
      element: "toggle",
      storeAs: "ephemeral",
      name: "If Possible, Make Message Ephemeral"
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
    let channel = await bridge.getInteraction(values.interaction);
    let message = bridge.get(values.message);

    let replyInteraction = bridge.getTemporary({ class: "interactionStuff", name: "current" });
    if (values.replyToInteraction && replyInteraction) {
      channel = replyInteraction
    }

    let flags = values.ephemeral == true ? 64 : 0;
    message.flags = flags;
    message.allowedMentions = {
      everyone: values.mentions || false,
      repliedUser: values.mentions || false,
      roles: values.mentions || false,
      users: values.mentions || false
    }
    let msg = await channel.createMessage(message.raw);


    bridge.store(values.store, msg);

    bridge.data.interactionHandlers[msg.id] = {}

    message.components?.forEach(component => {
      component.run(msg);
    })
  },
};