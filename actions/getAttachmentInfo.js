module.exports = {
  data: {
    name: "Get Attachment Info",
  },
  category: "Images",
  UI: [
    {
      element: "var",
      storeAs: "attachment",
      name: "Attachment"
    },
    "-",
    {
      element: "typedDropdown",
      storeAs: "get",
      name: "Get",
      choices: {
        url: {name: "URL"},
        proxyURL: {name: "Proxy URL"},
        filename: {name: "File Name"},
        contentType: {name: "Type"},
        width: {name: "Width"},
        height: {name: "Height"},
        size: {name: "Size"},
        id: {name: "ID"},
        ephemeral: {name: "Ephemeral?"},
      }
    },
    "-",
    {
      element: "store",
      storeAs: "store"
    }
  ],
  subtitle: (values, constants, thisAction) => {
    return `${thisAction.UI.find(e => e.element == 'typedDropdown').choices[values.get.type].name} of ${constants.variable(values.attachment)} - Store As: ${constants.variable(values.store)}`
  },
  compatibility: ["Any"],
  run(values, message, client, bridge) {
    let attachment = bridge.get(values.attachment);

    bridge.store(values.store, attachment[values.get.type])
  },
};