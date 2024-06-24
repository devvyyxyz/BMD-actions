module.exports = {
  data: {
    name: "Leave Server",
  },
  category: "Servers",
  UI: [
    {
      element: "text",
      text: "Use the \"Change Server\" action to change the guild you want to leave."
    }
  ],
  subtitle: "$[comment]$",
  compatibility: ["Any"],
  run(values, message, client, bridge) {
    bridge.guild.leave()
  },
};
