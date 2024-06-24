const { Guild } = require("oceanic.js");
module.exports = {
  data: {
    name: "Get Server Info",
  },
  category: "Servers",
  UI: [
    {
      element: "guild",
      storeAs: "guild"
    },
    "-",
    {
      element: "typedDropdown",
      name: "Get",
      storeAs: "get",
      choices: {
        name: { name: "Name" },
        iconURL: { name: "Icon URL" },
        bannerURL: { name: "Banner URL" },
        memberCount: { name: "Member Count" },
        humans: { name: "Humans" },
        bots: { name: "Bots" },
        approximatePresenceCount: { name: "Approximate Online Members Count" },
        members: { name: "Members" },
        roles: { name: "Roles" },
        channels: { name: "Channels" },
        owner: { name: "Owner" },
        id: { name: "ID" },
        mfaRequired: { name: "MFA Required" },
        premiumSubscriptionCount: { name: "Boosts Count" },
        premiumTier: { name: "Boost Level" },
        description: { name: "Description" },
        discoverySplashURL: { name: "Discovery Splash URL" },
        splashURL: { name: "Invite Splash URL" },
        webhooks: { name: "Webhooks" },
        bans: { name: "Banned Users" },
        emojis: { name: "Emojis" },
        invites: { name: "Invites" },
        afkChannel: { name: "AFK Channel" },
        afkTimeout: { name: "AFK Timeout (Seconds)" },
        createdAt: { name: "Creation Timestamp" },
      }
    },
    "-",
    {
      element: "store",
      storeAs: "store"
    }
  ],

  subtitle: (values, constants, thisAction) => {
    return `${thisAction.UI.find(e => e.element == 'typedDropdown').choices[values.get.type].name} of ${constants.guild(values.guild)} - Store As: ${constants.variable(values.store)}`
  },

  getMembers: async (bridge, get) => {
    let output = []
    const limit = 1000;

    async function push(members, get) {
      for (let member of members) {
        if (get == "IDs") {
          output.push(member.id);
        } else if (get == "Variables" || get == undefined) {
          output.push(member);
        } else {
          output.push(member.username);
        }
      };

      if (members.length == limit) {
        await push((await bridge.guild.getMembers({limit, after: members[members.length - 1].id})), get);
      }
    }

    let firstPage = await bridge.guild.getMembers({limit}, get);
    await push(firstPage, get);

    return output;
  },

  async run(values, message, client, bridge) {
    let output;
    
    /**
     * @type {Guild}
     */
    let guild = await bridge.getGuild(values.guild);

    switch (values.get.type) {
      case "members":
        output = await this.getMembers(bridge)
        break
      case "channels":
        output = await guild.getChannels()
        break
      case "iconURL":
        output = guild.iconURL();
        break;
      case "humans":
        output = (await this.getMembers(bridge)).filter(m => !m.bot);
        break;
      case "bots":
        output = (await this.getMembers(bridge)).filter(m => m.bot);
        break;
      case "owner":
        let owner = await bridge.getUser({ type: "id", value: guild.ownerID });
        output = owner;
        break;
      case "mfaRequired":
        output = guild.mfaLevel ? true : false
        break
      case "bannerURL":
        output = guild.bannerURL()
        break
      case "discoverySplashURL":
        output = guild.discoverySplashURL();
        break
      case "splashURL":
        output = guild.splashURL();
        break
      case "webhooks":
        output = await guild.getWebhooks();
        break
      case "bans":
        output = (await guild.getBans({limit: Infinity})).map(ban => ban.user)
        break
      case "emojis":
        output = (await guild.getEmojis());
        break
      case "invites":
        output = (await guild.getInvites())
        break
      case "createdAt":
        output = guild.createdAt.getTime();
        break
      default:
        output = guild[values.get.type];
        break
    }

    bridge.store(values.store, output)
  },
};
