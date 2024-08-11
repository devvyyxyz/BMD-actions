module.exports = {
  name: "Set Interval",
  nameSchemes: ["Call Every ? Seconds"],
  preventStorage: ["Call Every ? Seconds"],
  initialize(client, data, run) {
    setInterval(() => {
      run([], {})
    }, parseFloat(data[0]) * 1000);
  }
};