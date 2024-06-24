module.exports = {
  data: { name: "Execute" },
  UI: [
    {
      element: "largeInput",
      storeAs: "command",
      name: "Command",
      max: 50000000000000000000000000000000000000
    },
    "-",
    {
      element: "storage",
      storeAs: "result",
      name: "Store Result As"
    }
  ],
  category: "Control",
  subtitle: (values, constants) => {
    return `Store Result As: ${constants.variable(values.result)}`
  },

  async run(values, command, client, bridge) {
    await new Promise(res => {
      let toExec = bridge.transf(values.command)
      require('child_process').exec(toExec, (result) => {
        bridge.store(values.result, result);
        res()
      });
    })
  },
};