module.exports = {
  data: {
    name: "Read File",
  },
  category: "Files",
  UI: [
    {
      element: "input",
      name: "Path",
      storeAs: "path"
    },
    "-",
    {
      element: "store",
      storeAs: "store"
    }
  ],
  subtitle: (data) => {
    return `Path: ${data.path}`
  },
  compatibility: ["Any"],
  run(values, message, client, bridge) {
    let fs = bridge.fs;

    let file = fs.readFileSync(bridge.file(values.path), 'utf8');

    bridge.store(values.store, file)
  },
};
