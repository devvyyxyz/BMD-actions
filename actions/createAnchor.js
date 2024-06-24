module.exports = {
  data: { name: "Create Anchor", id: new Date().getTime() },
  category: "Anchors",
  UI: [
    {
      element: "input",
      storeAs: "id",
      name: "Anchor ID"
    }
  ],
  guide: [
    {
      element: "text",
      text: "What is an anchor?",
      large: true
    },
    {
      element: "text",
      text: "Anchors are basically checkpoints. Each anchor has an ID so you can later reference it when you wish to run an anchor. Every action placed after this will run once this anchor is called."
    },
  ],
  init: (data, bridge) => {
    bridge.createGlobal({class: "anchors", name: data.id, value: bridge.actions.slice(bridge.atAction + 1)});
  },
  subtitle: "ID: $[id]$",
  async run(values, message, client, bridge) {},
};
