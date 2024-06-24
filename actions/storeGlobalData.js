module.exports = {
    data: { name: "Store Global Data", source: { type: "string", value: "" } },
    category: "Global Data",
    UI: [
      {
        element: "input",
        storeAs: "dataName",
        name: "Data Name",
        placeholder: "Key",
      },
      "_",
      {
        element: "var",
        storeAs: "source",
        name: "New Value",
        also: {
          string: "Text",
        },
      },
    ],
    compatibility: ["Any"],
    subtitle: (data, constants) => {
      if (data.data.source.type == 'string') {
        return `Data Name: ${data.dataName} - New Value: ${data.data.source.value}`
      } else {
        return `Data Name: ${data.dataName} - New Value: ${constants.variable(data.data.source)}`
      }
    },
    async run(values, message, client, bridge) {
      var storedData = bridge.data.IO.get();
    
      let dataOverwrite;
  
      if (!values.source) {
        dataOverwrite = bridge.transf(values.dataValue);
      } else {
        if (values.source.type == "string") {
          dataOverwrite = bridge.transf(values.source.value);
        } else {
          dataOverwrite = bridge.get(values.source);
        }
      }
  
      storedData.lists[bridge.transf(values.dataName)] = dataOverwrite
      bridge.data.IO.write(storedData);
    },
  };