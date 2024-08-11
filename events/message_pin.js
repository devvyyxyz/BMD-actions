const { Client } = require("oceanic.js");

module.exports = {
  name: "Message Pin",
  nameSchemes: ["Store Message As"],
  
  /**
   * @param {Client} client
   * @param {*} data
   * @param {*} run
   */
  initialize(client, data, run) {
    client.on('messageCreate', async (message) => {
      if (message.type == 6) {
        let messageID = message.messageReference?.messageID;
        let channelID = message.messageReference?.channelID;
        let msg = await (client.getChannel(channelID) || await client.rest.channels.get(channelID)).getMessage(messageID) 
        run([
          msg
        ], msg);
      }
    })
  }
};
