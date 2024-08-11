
let version = `4.22.0 SNAP 1 BETA`;
const strings = getStrings();
let loadedAutomations = [];


const { app, ipcRenderer } = require("electron");
let selectedGroupType = "slash";
let copiedAction;
let isBotOn;
let lastFolder;
let globalVars = {};
let selectedActions = [];
let serverVars = {};
const fs = require("fs");
setInterval(() => {
  checkSaveStatus();
}, 5000);

const steamworks = require('steamworks.js');

let client;
try {
  client = steamworks.init(appID);
  // console.log('making')
  // client.workshop.createItem(appID).then(e => {
  //   client.workshop.updateItem(e.itemId, {
  //     changeNote: "Create this",
  //     title: "Test Thing Yk",
  //     contentPath: "./Workshop_Items/Command"
  //   }).then(e => {
  //     console.log(e);
  //     client.workshop.getItem(e.itemId).then(aaaaaaaaaa => {
  //       console.log(aaaaaaaaaa)
  //     })
  //   })
  // }).catch(err => console.log(err));
} catch (error) {
  console.log(error)
  setTimeout(() => {
    // notify('Unable to connect to steam, achievements & steam cloud will be unavailable')
  }, 1000);
}

ipcRenderer.on('backupClose', () => {
  document.body.style.opacity = 1;
});

let cachedActions = {};

fs.readdirSync(`${processPath}/AppData/Actions`).forEach(act => {
  try {
    cachedActions[act] = require(`${processPath}/AppData/Actions/${act}`);
  } catch (e) { }
});



ipcRenderer.on("botWindowStatus", (event, botOn) => {
  if (botOn == false || botOn == true) {
    isBotOn = true;
    document.getElementById("botStatus").innerHTML = strings.editor.bot_states_short[1];
    document.getElementById("turnBotOn").innerHTML = strings.editor.bot_states[0];
  } else {
    isBotOn = false;
    document.getElementById("botStatus").innerHTML = strings.editor.bot_states_short[0];
    document.getElementById("turnBotOn").innerHTML = strings.editor.bot_states[1];
  }
});

ipcRenderer.on('aliases', (event, newAliases) => {
  createCheckpoint();
  botData.commands[lastObj].aliases = newAliases;
  saveLocally();
})

ipcRenderer.on("eventSave", (event, eventData) => {
  createCheckpoint();
  botData.commands[lastObj].eventFile = eventData.file;
  botData.commands[lastObj].eventData = eventData.data;
  highlight(document.getElementById(`Group${lastObj}`));
  checkSaveStatus();
});

function toggleBotStatus() {
  if (!isBotOn) {
    ipcRenderer.send("runBot");
  } else {
    ipcRenderer.send("shutdownBot");
  }
}

function editAction(options) {
  createCheckpoint();
  checkSaveStatus();

  let commandVars = [];

  let variables = { temporary: [] };
  let actionType = "text";
  if (botData.commands[lastObj].type == "event") {
    actionType = "event";
    try {
      let event = require(processPath +
        "/AppData/Events/" +
        botData.commands[lastObj].eventFile);
      for (let eventVariableStorageName in event.nameSchemes) {
        if (
          event.preventStorage &&
          event.preventStorage.includes(
            event.nameSchemes[eventVariableStorageName]
          )
        ) {
        } else {
          commandVars.push(
            botData.commands[lastObj].eventData[eventVariableStorageName]
          );
        }
      }
    } catch (err) { }
  } else {
    if (botData.commands[lastObj].trigger == "slashCommand") {
      actionType = "slash";
      if (botData.commands[lastObj].parameters) {
        for (let parameterI in botData.commands[lastObj].parameters) {
          let parameter = botData.commands[lastObj].parameters[parameterI];
          commandVars.push(parameter.storeAs);
        }
      }
    } else if (botData.commands[lastObj].trigger == 'user') {
      actionType = "user";
    } else if (botData.commands[lastObj].trigger == 'message') {
      actionType = "message";
    }
  }

  let endGlobal = [];
  let endServer = [];
  let thisGlobal = [];
  let thisServer = [];

  for (let cmd in globalVars) {
    endGlobal = globalVars[cmd] || [];
  }

  for (let cmd in serverVars) {
    endServer = serverVars[cmd] || [];
  }

  variables.global = endGlobal;
  variables.server = endServer;

  for (let action in botData.commands[lastObj].actions) {
    let act = botData.commands[lastObj].actions[action];

    if (action != lastAct) {
      try {
        let result = scrapeVars(cachedActions[act.file].UI, act.data);
        commandVars = [...commandVars, ...result.temporary];
        variables.global = [...variables.global, ...endGlobal, ...result.global];
        variables.server = [...variables.server, ...endServer, ...result.server];
      } catch (error) { console.log(error) }
    } else {
      try {
        let result = scrapeVars(cachedActions[act.file].UI, act.data);
        variables.temporary = result.temporary;
        thisGlobal = [...thisGlobal, ...result.global];
        thisServer = [...thisServer, ...result.server];
      } catch (error) { console.log(error) }
    }
  }

  variables.commandVars = commandVars;
  variables.thisServer = thisServer;
  variables.thisGlobal = thisGlobal;

  ipcRenderer.send("editAction", {
    action: lastAct,
    actions: botData.commands[lastObj].actions,
    variables: variables,
    actionType: actionType,
    options: (options || { picker: false })
  });
}

ipcRenderer.on("childSave", (event, data, copied) => {
  createCheckpoint()

  botData.commands[lastObj].actions[lastAct] = data;
  saveLocally();
  refreshActions();
  copiedAction = copied;

  globalVars[botData.commands[lastObj].customId] = [];
  serverVars[botData.commands[lastObj].customId] = [];

  for (let act in botData.commands[lastObj].actions) {
    let action = botData.commands[lastObj].actions[act];
    try {
      let UI = cachedActions[action.file].UI;
      scrapeForVariables(UI, action.data, botData.commands[lastObj].customId);
    } catch (err) { }
  }
  checkSaveStatus();
});

function openParameters() {
  if (!botData.commands[lastObj].description) {
    botData.commands[lastObj].description = "No Description";
  }
  ipcRenderer.send("editParameters", {
    parameters: botData.commands[lastObj].parameters || [],
    name: botData.commands[lastObj].name,
    description: botData.commands[lastObj].description,
  });
}

ipcRenderer.on("parametersSave", (event, data) => {
  createCheckpoint();
  botData.commands[lastObj].parameters = data.parameters;
  saveLocally();
  checkSaveStatus();
  highlight(document.getElementById(`Group${lastObj}`));
});

ipcRenderer.on("childClose", () => {
  document.body.style.opacity = "100%";
});

let lastHovered;
let menu = null;
let errorPending = false;
var botData = JSON.parse(fs.readFileSync("./AppData/data.json", 'utf8'));
let lastType = 0; // 0 = Command; 1 = Actions;
let lastObj = 0;
let lastAct = 0;
let lastHighlighted;
let themeColor = botData.color;
if (ownSettings.theme == 'default') {
  document.body.style.background = `linear-gradient(130deg, ${ownSettings.firstColor || `rgb(0, 0, 0)`}, ${ownSettings.secondColor || `rgb(18, 18, 18)`})`;
} else {
  document.body.style.background = `var(--main-background)`;
}
document.onkeydown = function (event) {
  handleKeybind(event);
};
if (editorSettings.focus) {
  if (botData.colorsVisibility) {
    toggleColorsVisibility()
  }
}
document.documentElement.style.setProperty("--highlight-color", botData.color);
let customIDsCalculated = 0;
let alreadyUsedIDs = {};
let scrapeForVariables = (UI, data, cID) => {
  for (let i in UI) {
    try {
      let element = UI[i];
      if (typeof element != "string") {
        if (
          element.element == "storageInput" ||
          element.element == "storage" ||
          element.element == "store"
        ) {
          if (data[element.storeAs].type == "global") {
            if (!globalVars[cID]) {
              globalVars[cID] = [];
            }
            globalVars[cID].push(data[element.storeAs].value);
          } else if (data[element.storeAs].type == "server") {
            if (!serverVars[cID]) {
              serverVars[cID] = [];
            }

            serverVars[cID].push(data[element.storeAs].value);
          }
        }
        if (element.element == "menu") {
          for (let menu in data[element.storeAs]) {
            let elm = data[element.storeAs][data[element.storeAs][menu].type];
            scrapeForVariables(
              element.UItypes[data[element.storeAs][menu].type].UI,
              data[element.storeAs][menu].data,
              cID
            );
          }
        }

        if (element.element == "case" || element.element == "condition") {
          if (data[element.storeAs].type == "runActions") {
            for (let i in data[element.storeActionsAs]) {
              let action = data[element.storeActionsAs][i];
              if (!action.id || alreadyUsedIDs[action.id]) {
                action.id = new Date().getTime() + customIDsCalculated;
                customIDsCalculated++
              }
              alreadyUsedIDs[action.id] = true;
              try {
                let act = cachedActions[action.file];
                scrapeForVariables(act.UI, action.data, cID);
              } catch (err) { }
            }
          }
        }

        if (element.element == "actions") {
          for (let i in data[element.storeAs]) {
            let action = data[element.storeAs][i];
            if (!action.id || alreadyUsedIDs[action.id]) {
              action.id = new Date().getTime() + customIDsCalculated;
              customIDsCalculated++
            }
            alreadyUsedIDs[action.id] = true;
            try {
              let act = cachedActions[action.file];
              scrapeForVariables(act.UI, action.data, cID);
            } catch (err) { }
          }
        }
      }
    } catch (err) {
    }
  }
};


let scrapeVars = (UI, data) => {
  let toReturn = {
    temporary: [],
    server: [],
    global: []
  };
  for (let i in UI) {
    try {
      let element = UI[i];
      if (typeof element != "string") {
        if (
          element.element == "storageInput" ||
          element.element == "storage" ||
          element.element == "store"
        ) {
          if (data[element.storeAs].type == "temporary") {
            toReturn.temporary = [...toReturn.temporary, data[element.storeAs].value];
          }
          if (data[element.storeAs].type == "server") {
            toReturn.server = [...toReturn.server, data[element.storeAs].value];
          }
          if (data[element.storeAs].type == "global") {
            toReturn.global = [...toReturn.global, data[element.storeAs].value];
          }
        }
        if (element.element == "menu") {
          for (let menu in data[element.storeAs]) {
            let result = scrapeVars(element.UItypes[data[element.storeAs][menu].type].UI, data[element.storeAs][menu].data);
            toReturn.temporary = [...toReturn.temporary, ...result.temporary];
            toReturn.server = [...toReturn.server, ...result.server];
            toReturn.global = [...toReturn.global, ...result.global];
          }
        }

        if (element.element == "case" || element.element == "condition") {
          if (data[element.storeAs].type == "runActions") {
            for (let i in data[element.storeActionsAs]) {
              let action = data[element.storeActionsAs][i];
              try {
                let act = cachedActions[action.file];
                let result = scrapeVars(act.UI, action.data);
                toReturn.temporary = [...toReturn.temporary, ...result.temporary];
                toReturn.server = [...toReturn.server, ...result.server];
                toReturn.global = [...toReturn.global, ...result.global];
              } catch (err) { console.log(err) }
            }
          }
        }

        if (element.element == "actions") {
          for (let i in data[element.storeAs]) {
            let action = data[element.storeAs][i];
            try {
              let act = cachedActions[action.file];
              let result = scrapeVars(act.UI, action.data);
              toReturn.temporary = [...toReturn.temporary, ...result.temporary];
              toReturn.server = [...toReturn.server, ...result.server];
              toReturn.global = [...toReturn.global, ...result.global];
            } catch (err) { console.log(err) }
          }
        }
      }
    } catch (err) {
    }
  }
  return toReturn
};

for (let cmd in botData.commands) {
  let command = botData.commands[cmd];
  for (let i in command.actions) {
    let action = command.actions[i];
    if (!action.id || alreadyUsedIDs[action.id]) {
      action.id = new Date().getTime() + customIDsCalculated;
      customIDsCalculated++
    }
    alreadyUsedIDs[action.id] = true;

    try {
      let act = cachedActions[action.file];
      scrapeForVariables(act.UI, action.data, command.customId);
    } catch (err) { }
  }
}


let clicks = 0;
try {
  clicks = settingsFS.readFileSync('./clicks', 'utf8');
} catch (error) { }

try {
  setInterval(() => {
    if (new Date().getHours() == 0) {
      client.achievement.activate('MIDNIGHT')
    }
    if (botData.commands.length > 40) {
      client.achievement.activate('ON_FIRE')
    }
  }, 60000);
} catch (error) { }
document.addEventListener('mousedown', () => {
  clicks = Number(clicks);
  if (clicks > 1250) {
    client.achievement.activate('MADMAN')
  }
  if (clicks > 7500) {
    client.achievement.activate('GRASS')
  }
  if (clicks > 20000) {
    client.achievement.activate('TIMELESS')
  }

  clicks++

  settingsFS.writeFileSync('./clicks', clicks.toString())
});


saveLocally()

function refreshActions(fadeLast, dontUpdate, commandOverwrite) {
  const toReplaceWith = lastObj;
  lastObj = commandOverwrite || lastObj;

  if (!dontUpdate) {
    selectedActions = [];
    document.getElementById("actionbar").innerHTML = "";
  }
  botData.commands[lastObj].actions = botData.commands[lastObj].actions.filter(
    (action) => action != null
  );
  saveLocally();

  let endHTML = "";
  let endActions = [];

  for (let a in botData.commands[lastObj].actions) {
    let action = botData.commands[lastObj].actions[a];
    let actionData;
    let endAction = {
      subtitle: "",
      found: false,
      file: action.file,
      borderType: "bordercentere",
    };
    try {
      actionData = cachedActions[action.file];
    } catch (err) { }

    // if (botData.commands[lastObj].actions[parseFloat(a) - 1] == undefined) {
    //   endAction.borderType = "borderbottom";
    // } else if (botData.commands[lastObj].actions[parseFloat(a) + 1] == undefined) {
    //   endAction.borderType = "bordertop";
    // }

    if (actionData) {
      endAction.found = true;
      endAction.name = action.name;
      try {
        if (actionData.subtitle) {
          if (typeof actionData.subtitle == "function") {
            endAction.subtitle = actionData.subtitle(action.data, {
              user: (user) => {
                let translations = {
                  author: "Command Author",
                  mentioned: "Mentioned User",
                  user: "Command User",
                  messageAuthor: "Message Author",

                  id: "ID",

                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = ["mentioned", "author", "user", "messageAuthor"];
                if (!disabledInputTypes.includes(user.type)) {
                  return `${translations[user.type]} (${user.value || "Blank"
                    })`;
                } else {
                  return `${translations[user.type]}`;
                }
              },
              channel: (channel) => {
                let translations = {
                  id: "Channel ID",
                  userID: "User ID",
                  command: "Command Channel",
                  user: "Command User",
                  commandAuthor: "Command Author",
                  mentionedChannel: "Mentioned Channel",
                  mentionedUser: "Mentioned User",

                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = [
                  "command",
                  "commandAuthor",
                  "mentionedUser",
                  "mentionedChannel",
                  "user"
                ];
                if (!disabledInputTypes.includes(channel.type)) {
                  return `${translations[channel.type]} (${channel.value || "Blank"
                    })`;
                } else {
                  return `${translations[channel.type]}`;
                }
              },
              role: (role) => {
                let translations = {
                  id: "ID",
                  mentioned: "Mentioned Role",
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = ["mentioned"];
                if (!disabledInputTypes.includes(role.type)) {
                  return `${translations[role.type]} (${role.value || "Blank"
                    })`;
                } else {
                  return `${translations[role.type]}`;
                }
              },
              guild: (guild) => {
                let translations = {
                  current: "Current",
                  id: "ID",
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = ["current"];
                if (!disabledInputTypes.includes(guild.type)) {
                  return `${translations[guild.type]} (${guild.value || "Blank"})`;
                } else {
                  return `${translations[guild.type]}`;
                }
              },
              message: (message) => {
                let translations = {
                  commandMessage: "Command Message",
                  interactionReply: "Command Reply",
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = ["commandMessage", "interactionReply"];
                if (!disabledInputTypes.includes(message.type)) {
                  return `${translations[message.type]} (${message.value || "Blank"
                    })`;
                } else {
                  return `${translations[message.type]}`;
                }
              },
              interaction: (interaction) => {
                let translations = {
                  commandInteraction: "Command Interaction",
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = ["commandInteraction"];
                if (!disabledInputTypes.includes(interaction.type)) {
                  return `${translations[interaction.type]} (${interaction.value || "Blank"
                    })`;
                } else {
                  return `${translations[interaction.type]}`;
                }
              },
              image: (image) => {
                let translations = {
                  file: "File",
                  url: "URL",
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                };

                let disabledInputTypes = [];
                if (!disabledInputTypes.includes(image.type)) {
                  return `${translations[image.type]} (${image.value || "Blank"
                    })`;
                } else {
                  return `${translations[image.type]}`;
                }
              },
              variable: (variables) => {
                let translations = {
                  tempVar: "Temporary Variable",
                  serverVar: "Server Variable",
                  globVar: "Global Variable",
                  temporary: "Temporary Variable",
                  server: "Server Variable",
                  global: "Global Variable",
                };
                return `${translations[variables.type]} (${variables.value || "Blank"
                  })`;
              },
            }, actionData);
          } else {
            let actionSubtitle = actionData.subtitle;
            const subtitleRegex = /(\$\[.*?\]\$)/g;
            endAction.subtitle = actionSubtitle.replace(
              subtitleRegex,
              (match, key) => {
                let dataName = key
                  .split("$[")[1]
                  .split("]$")[0]
                  .replaceAll("*", "");
                return action.data[dataName];
              }
            );
          }
        }
      } catch (err) { }
    } else {
      endAction.name = action.name;
    }

    endAction.subtitle = endAction.subtitle?.replaceAll("<", "<​");

    endActions.push(endAction);
  }

  let leftSeparatorDisplay, rightSeparatorDisplay, subtitlePosition;

  switch (editorSettings.subtitlePosition) {
    case "left":
      leftSeparatorDisplay = "none";
      rightSeparatorDisplay = "inherit; margin-left: 5px !important;";
      subtitlePosition = "margin-left: 5px !important; margin-right: auto;";
      break;
    case "right":
      rightSeparatorDisplay = "none";
      leftSeparatorDisplay =
        "inherit; margin-right: 5px !important; margin-left: 10px !important;";
      subtitlePosition = "margin-right: 0; margin-left: auto;";
      deleteButtonStyling = "margin-left: 5px;";
      break;
    case "center":
      rightSeparatorDisplay = "inherit";
      leftSeparatorDisplay = "inherit; margin-left: 5px !important;";
      subtitlePosition = "margin-right: 5px; margin-left: 5px;";
      break;
  }

  if (editorSettings.focus) {
    rightSeparatorDisplay = 'none'
    leftSeparatorDisplay = 'none'
  }

  for (let index in endActions) {
    let action = endActions[index];
    let errors = "";

    if (action.found == false) {
      errors = `
      <div style="background-color: #00000040; padding: 3px; font-size: 13px; margin: auto; margin-left: 1vw; border-radius: 6px;">Action Not Found!</div>
    `;
    }
    endHTML += `
      <div class="action textToLeft ${fadeLast && index == botData.commands[lastObj].actions.length - 1 ? "fade" : ""}" ondblclick="editAction()" 
      onmouseenter="lastHovered = this"
      draggable="true"
      ondragleave="handleActionDragEnd(this)"
      ondragend="handleActionDrop()"
      ondragover="actionDragOverHandle(event, this)"
      ondragstart="handleActionDrag(this)"
      style="animation-duration: 0.2s;"
      onmouseleave="lastHovered = null;"
      onclick="highlight(this)" id="Action${index}">

      <text class="indicator">${editorSettings.focus ? "" : "#"}${parseFloat(index) + 1}</text>
      <div style="margin-right: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 24px; max-width: 200px !important;">${action.name.substring(0, 256)}</div>
      ${errors}
      <div style="flex-grow: 1; opacity: 0; display: ${leftSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>
      <div style="max-width: 50vw; min-width: 0vw; overflow: hidden;">
      <div style="margin-left: 5px; margin-right: 5px; ${subtitlePosition}; opacity: ${editorSettings.focus ? "30" : '50'}%; width: 100%; height: 24px;">
      <div style="text-overflow: ellipsis;">${action.subtitle.replaceAll("", "​")}</div>
      </div>
      </div>
      <div style="flex-grow: 1; opacity: 0; display: ${rightSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>

      <div class="deleteActionButton flexbox ${editorSettings.focus ? "noShow" : ''}" onclick="deleteAction(${index})" style="margin-left: 1vw;"><div class="image trash"></div></div>
      </div>
    `;
  }

  if (!dontUpdate) {
    document.getElementById("actionbar").innerHTML = endHTML;

    highlight(document.getElementById(`Action${lastAct}`));
  } else {
    return endHTML;
  }
  lastObj = toReplaceWith;
}

function hideAliases() {
  let aliasBox = document.getElementById('Command_Name').nextElementSibling;
  let commandNameBox = document.getElementById('Command_Name');
  commandNameBox.classList.remove('rounded_less_right')

  commandNameBox.style.marginRight = ''
  commandNameBox.style.width = '100%'
  aliasBox.style.display = 'none'
}

function showAliases() {
  let aliasBox = document.getElementById('Command_Name').nextElementSibling;
  let commandNameBox = document.getElementById('Command_Name');

  commandNameBox.classList.add('rounded_less_right')

  commandNameBox.style.width = 'var(--alias-shown-input-width)'
  commandNameBox.style.marginRight = '0px'

  aliasBox.style.width = '35px'
  aliasBox.style.display = ''
}

let undoList = [];

let redoList = [];

function createCheckpoint(options) {
  const newUndoStuff = {
    JSON: JSON.stringify(botData.commands),
    folders: JSON.stringify(botData.folders),
    createdAt: Date.now(),
  };

  if (newUndoStuff.JSON == undoList[0]?.JSON) return

  undoList.unshift(newUndoStuff);
  redoList = [];

  if (undoList.length > 200) {
    undoList.splice(undoList.length - 1, 2)
  }
}

function undo() {
  if (areSettingsOpen) return;
  let undoElement = undoList[0];

  undoElement.JSON;

  redoList.splice(0, 0, {
    JSON: JSON.stringify(botData.commands),
    folders: JSON.stringify(botData.folders),
    createdAt: Date.now()
  });

  botData.commands = JSON.parse(undoElement.JSON);
  botData.folders = JSON.parse(undoElement.folders);
  undoList.splice(0, 1);
  recacheFolders();
  refreshGroups();
  saveLocally();
  checkSaveStatus();
}

function redo() {
  if (areSettingsOpen) return;

  let redoElement = redoList[0];
  let oldJSON = JSON.stringify(botData.commands);
  let oldFolders = JSON.stringify(botData.folders);
  botData.commands = JSON.parse(redoElement.JSON);
  botData.folders = JSON.parse(redoElement.folders);

  redoElement.JSON = oldJSON;
  redoElement.folders = oldFolders;

  redoList.splice(0, 1);
  undoList.splice(0, 0, redoElement);

  recacheFolders();
  refreshGroups();
  saveLocally();
  checkSaveStatus();
}

function newFolder() {
  createCheckpoint();
  const folderID = Number(`${new Date().getTime()}`);
  let newFolder = {
    name: "Folder",
    color: null,
  };

  botData.folders[folderID] = newFolder;
  if (Array.isArray(botData.commands[lastObj].folder)) {
    botData.commands[lastObj].folder.push(folderID)
  } else {
    botData.commands[lastObj].folder = [folderID]
  }


  saveLocally();
  recacheFolders();
  refreshGroups();
}
let closedFolders = {};
let cachedFolders = {};

function hideEditorSpecifics() {
  document.getElementById("infoTile").style.height = "0px";
  document.getElementById("infoTile").style.paddingTop = "0px";
  document.getElementById("infoTile").style.paddingBottom = "0px";
  document.getElementById("infoTile").style.overflow = "hidden";
  document.getElementById("infoTile").style.marginTop = "0";
  document.getElementById('edutor').firstElementChild.classList.remove('borderbottomz')
}
function showEditorSpecifics(event) {
  document.getElementById("infoTile").style.paddingTop = "0px";
  document.getElementById("infoTile").style.paddingBottom = "0px";
  document.getElementById("infoTile").style.marginTop = "4px";
  document.getElementById("infoTile").style.height = "32px";

  document.getElementById('edutor').firstElementChild.classList.add('borderbottomz')

  if (event) {
    hideTypeDropdown()
  } else {
    showTypeDropdown()
  }
}

function hideTypeDropdown() {
  let dropdownContainer = document.getElementById('typeDropdownContainer');
  dropdownContainer.style.width = '0%'
  dropdownContainer.style.display = 'none'
  let inputContainer = document.getElementById('nameContainer');
  inputContainer.style.width = '100%'
}
function showTypeDropdown() {
  let dropdownContainer = document.getElementById('typeDropdownContainer');
  dropdownContainer.style.width = '50%'
  dropdownContainer.style.display = ''
  let inputContainer = document.getElementById('nameContainer');
  inputContainer.style.width = '50%'
}

function recacheFolders() {
  if (!botData.folders) {
    botData.folders = {};
    saveLocally();
  }

  cachedFolders = {};
  for (let f in botData.folders) {
    let folder = botData.folders[f];
    closedFolders[f] = folder.closed
    cachedFolders[f] = {
      ...folder,
      id: f,
      last: [],
      first: []
    };
  }

  let knownFoldersPlacement = {};

  botData.commands.forEach((command, index) => {
    if (!Array.isArray(command.folder) && command.folder) {
      command.folder = [command.folder];
    }

    command.folder = Array.from(new Set(command.folder))
    if (command.folder?.length > 10) {
      let folder = command.folder;
      command.folder = [folder[0], folder[1], folder[2], folder[3], folder[4], folder[5], folder[6], folder[7], folder[8], folder[9]]
    }
    for (let i in command.folder) {
      if (!botData.folders[command.folder[i]]) {
        command.folder.splice(i, 1);
        saveLocally();
      } else {
        if (cachedFolders[command.folder[i]]) {
          let commandFolder = command.folder[i];
          if (!knownFoldersPlacement[commandFolder]) {
            knownFoldersPlacement[commandFolder] = {};
          }

          if (knownFoldersPlacement[commandFolder].first == undefined) {
            knownFoldersPlacement[commandFolder].first = index;
          } else {
            knownFoldersPlacement[commandFolder].last = index;
          }
        }
      }
    }
  });

  for (let f in cachedFolders) {
    if (knownFoldersPlacement[f] && knownFoldersPlacement[f].first != undefined) {
      if (knownFoldersPlacement[f] && knownFoldersPlacement[f].last == undefined) {
        knownFoldersPlacement[f].last = knownFoldersPlacement[f]?.first;
      }
      cachedFolders[f] = { ...cachedFolders[f], ...knownFoldersPlacement[f] };
    } else {
      delete cachedFolders[f];
      delete botData.folders[f];
      saveLocally();
    }
  }
}

setTimeout(() => {
  recacheFolders();
  refreshGroups();
}, 150);

function refreshGroups(fadeLast, dontUpdate) {
  let firstOnScreen = true;
  let endHTML = "";
  if (!dontUpdate) {
    document.getElementById("commandbar").innerHTML = "";
  }

  let firstCompatibleGroup;

  for (let cmd in botData.commands) {
    if (!firstCompatibleGroup) {
      try {
        let command = botData.commands[cmd];

        if (command.type == "action" && selectedGroupType == "command") {
          firstCompatibleGroup = cmd;
        } else if (command.type == "event" && selectedGroupType == "event") {
          firstCompatibleGroup = cmd;
        }
      } catch (error) { }
    }
  }

  let firstGroup;
  var delay = 0;

  for (let cmd in botData.commands) {
    try {
      if (!firstCompatibleGroup) {
        document.getElementById("actionbar").innerHTML = "";
      }
      let groupType = botData.commands[cmd].type;
      let endType;
      if (groupType == "action") {
        endType = "command";
      } else {
        endType = "event";
      }

      if (endType == selectedGroupType) {
        if (!firstGroup) {
          firstGroup = cmd;
        }

        let additional = "";
        let endAdditional = "";
        let folderNesting = false;
        if (Array.isArray(botData.commands[cmd].folder)) {
          for (let f in botData.commands[cmd].folder) {
            if (cachedFolders[botData.commands[cmd].folder[f]]?.first == cmd) {
              if (botData.commands[cmd].folder[f] != botData.commands[cmd].folder[0]) {
                folderNesting = true;
              } else {
                folderNesting = false;
              }

              let folder = botData.commands[cmd].folder[f];
              additional += `
              <div class="${folderNesting ? "nestedFolder" : ""}" ${!folderNesting ? `style="overflow: hidden !important; border-bottom-left-radius: var(--round-off);"` : ""} data-first="${firstOnScreen}" ondragover="lastDraggedOverFolder = ${folder}; lastDraggedOverThing = 2;" ondragleave="draggedOverFolder = undefined">
              <div
              style="${cachedFolders[folder].color ? `background: ${cachedFolders[folder].color.split(')')} 0.10)` : ""}"
              onmouseenter="colorize(this, ${folder}, 1);"
              onmouseover="lastHovered = {id: 'folder', specifically: ${folder}}"
              onmouseleave="colorize(this, ${folder}, 2); lastHovered = undefined;"
              onmousedown="colorize(this, ${folder}, 3);"
              ondragenter="if (draggedFolder != undefined) {if (cachedFolders[draggedFolder].first > ${cachedFolders[folder].first}) {draggedOverGroup = ${cachedFolders[folder].first}} else {draggedOverGroup = ${cachedFolders[folder].last}}} else {if(draggedGroup > ${cachedFolders[folder].last}) {draggedOverGroup = ${cachedFolders[folder].first}} else {draggedOverGroup = ${cachedFolders[folder].last}}}; event.preventDefault();"
              ondragover="if (draggedFolder != undefined) {if (cachedFolders[draggedFolder].first > ${cachedFolders[folder].first}) {draggedOverGroup = ${cachedFolders[folder].first}} else {draggedOverGroup = ${cachedFolders[folder].last}}} else {if(draggedGroup > ${cachedFolders[folder].last}) {draggedOverGroup = ${cachedFolders[folder].first}} else {draggedOverGroup = ${cachedFolders[folder].last}}}; event.preventDefault();"
              onmouseup="colorize(this, ${folder}, 4)" 
              onclick="highlightFolder(${folder})"
              draggable="true"
              ondblclick="toggleFolderVisibility('${folder}', this.firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling)"
              ondragstart="handleFolderDragStart(${folder})"
              ondragend="handleFolderDragEnd(${folder})"
              id="${folder}"
              class="flexbox dimension noanims action folderHandle">
              <text class="indicator"><div class="image folder" style="width: 16px; height: 18px; margin: auto !important;"></div></text>
              <span id="${folder}Foldername" style="width: auto; max-width: 80%; overflow: hidden;">${cachedFolders[folder].name.replaceAll("<", "<​")}</span>
                <div class="deleteActionButton flexbox ${editorSettings.focus ? "noShow" : ''}" onclick="deleteFolder(${folder})"><div class="image trash"></div></div>
                <div id="${folder}closebutton" class="deleteActionButton ${editorSettings.focus ? "noShow" : ''}" onclick="toggleFolderVisibility('${folder}', this)" style="margin-left: 4px; rotate: ${closedFolders[folder] ? "180deg" : "0deg"};">↑</div>
              </div>
              <div class="dimension folderContainer ${closedFolders[folder] ? 'closedFolder' : ''}" id="${folder}content"
              ondragover="draggedOverFolder = ${folder}; event.preventDefault()"
              ondragleave="draggedOverFolder = null;"
              style="height: ${closedFolders[folder] ? '0' : 'auto'}; overflow: hidden; width: calc(100% - 12px); margin: auto; transition: all var(--commonAnimation) var(--ease-strong);">
            `;
              marginTop = "0px";
              firstOnScreen = false;
            }

            if (cachedFolders[botData.commands[cmd].folder[f]]?.last == cmd) {
              endAdditional += `</div></div>`;
              firstOnScreen = false;
            }
          }
        }

        delay++;
        let preDeco = ``;

        if (!editorSettings.hideCommandInvokers) {
          let commandTriggerMap = {
            textCommand: botData.prefix,
            slashCommand: "/",
          }

          preDeco = commandTriggerMap[botData.commands[cmd].trigger] || `<div class="image openExternally" style="width: 16px; height: 18px; margin: auto !important;"></div>`;
        }

        let groupDecoration = ``;
        endHTML += `
      ${additional}
      <div class="action textToLeft flexbox noanims ${cmd == botData.commands.length - 1 && fadeLast ? "fade" : ""}" draggable="true"
        onmouseenter="lastHovered = this; colorize(this, ${cmd}, 1);"
        ondragleave="handleGroupDragEnd(this);"
        ondragend="handleGroupDrop()"
        ondragover="lastDraggedOverThing = 1; groupDragOverHandle(event, this)"
        ondragstart="handleGroupDrag(this)"
        onmouseleave="lastHovered = null; colorize(this, ${cmd}, 2)"
        id="Group${parseFloat(cmd)}" style="background-color: ${botData.commands[cmd].color ? botData.commands[cmd].color.split(")") + " 0.09)" : "var()"}" onclick="highlight(this);" onmousedown="colorize(this, ${cmd}, 3);" onmouseup="colorize(this, ${cmd}, 4)">
        <text class="indicator">${preDeco}</text>
        <div id="${cmd}Groupname">
        ${botData.commands[cmd].name.substring(0, 24)}${botData.commands[cmd].name.length > 23 ? "..." : ""}
        </div> <div style="opacity: ${editorSettings.focus ? "30" : "50"}%; margin-left: 7px;"><span id="${cmd}Groupcount">${botData.commands[cmd].actions.length}</span> Actions ${groupDecoration}</div>
        <div class="deleteActionButton flexbox ${editorSettings.focus ? "noShow" : ''}" onclick="deleteCommand(${cmd})"><div class="image trash"></div></div></div>
        ${endAdditional}
        `;
      }
    } catch (error) {
      botData.commands.splice(cmd, 1);
    }
  }

  if (!dontUpdate) {
    document.getElementById("commandbar").innerHTML = endHTML;
  } else {
    return endHTML;
  }

  let editor = document.getElementById("edutor");
  if (delay == 0) {
    editor.style.scale = "0.3";
    editor.style.opacity = "0";
    setTimeout(() => {
      editor.style.scale = "0";
    }, 150);
  } else {
    editor.style.scale = "1";
    setTimeout(() => {
      editor.style.scale = "1";
    }, 150);
    editor.style.opacity = "1";
  }

  if (document.getElementById(`Group${lastObj}`)) {
    try {
      highlight(document.getElementById(`Group${lastObj}`));
    } catch (err) {
      highlight(document.getElementById(`Group${firstCompatibleGroup}`));
    }
  } else {
    highlight(document.getElementById(`Group${firstCompatibleGroup}`));
  }
}

function recalculateFolderHeight(starterID, repeated) {
  if (Array.isArray(botData.commands[cachedFolders[starterID].first].folder)) {
    botData.commands[cachedFolders[starterID].first].folder.forEach((id) => {
      if (id != starterID) return;
      let folder = document.getElementById(`${id}`);
      let folderContent = document.getElementById(`${id}content`);

      if (closedFolders[id]) {
        let height = folderContent.clientHeight;
        folderContent.style.height = height + 'px';
        folderContent.style.overflow = 'hidden';
        folderContent.classList.add('closedFolder')


        setTimeout(() => {
          folderContent.style.height = '0px'
        }, 10);
      } else {
        let heightGuesser = document.createElement('div');
        heightGuesser.innerHTML = folderContent.innerHTML;
        heightGuesser.style.opacity = '0';
        document.body.appendChild(heightGuesser);
        let height = heightGuesser.clientHeight;
        folderContent.classList.remove('closedFolder')
        heightGuesser.remove();

        setTimeout(() => {
          folderContent.style.height = (height + 0) + 'px';
          setTimeout(() => {
            folderContent.style.height = 'auto'
          }, editorSettings.commonAnimation * 100);
        }, 10);
      }
    })
  }

  setTimeout(() => {
    if (repeated) return;
    recalculateFolderHeight(id, true)
  }, 30);
}

function toggleFolderVisibility(id, button) {
  createCheckpoint({ recacheFolders: true });
  if (!closedFolders[id]) {
    botData.folders[id].closed = true;
    closedFolders[id] = true;

    setTimeout(() => {
      button.style.transition = 'all 0.5s cubic-bezier(.41,-0.58,.48,1.53)'
      button.style.rotate = '180deg'
      saveLocally();
      checkSaveStatus();
    }, 10);
  } else {
    botData.folders[id].closed = false;
    closedFolders[id] = false;

    setTimeout(() => {
      button.style.rotate = '359deg'
    }, 10);
    setTimeout(() => {
      button.style.transition = 'all 0s ease'
      setTimeout(() => {
        button.style.rotate = '0deg'
        setTimeout(() => {
          button.style.transition = 'all 0.5s cubic-bezier(.41,-0.58,.48,1.53)'
        }, 10);
      }, 10);
    }, 500);

    setTimeout(() => {
      saveLocally();
      checkSaveStatus();
    }, editorSettings.commonAnimation * 100);
  }

  recalculateFolderHeight(id);
}

function highlightFolder(id) {
  hideTypeDropdown();
  lastType = 2;
  hideAliases()
  hideEditorSpecifics();
  try {
    document.getElementById(`Group${lastObj}`).classList.remove('highlighted')
    if (botData.commands[lastObj].color != undefined) {
      document.getElementById(`Group${lastObj}`).style.background = botData.commands[lastObj].color.split(")") + " 0.09)";
    } else {
      document.getElementById(`Group${lastObj}`).style.background = "";
    }
  } catch (err) { }
  lastObj = undefined;
  if (editorSettings.focus) {
    document.getElementById('actionsOf').innerHTML = ``
    document.getElementById('actionbar').innerHTML = ''
  } else {
    document.getElementById('actionsOf').innerHTML = strings.editor.folder_no_actions;
    document.getElementById('actionbar').classList.add('flexbox')
    document.getElementById('actionbar').innerHTML = `
      <div class="image folder" style="width: 50px; height: 50px;"></div>
    `
  }

  if (lastFolder) {
    document.getElementById(lastFolder).classList.remove('highlighted')
    if (cachedFolders[lastFolder]?.color) {
      let color = cachedFolders[lastFolder].color.split(")");
      document.getElementById(lastFolder).style.background = `${color} 0.10)`;
    } else {
      document.getElementById(lastFolder).style.background = ``;
    }
  }

  lastFolder = id;
  document.getElementById(lastFolder).classList.add('highlighted')

  if (cachedFolders[id].color) {
    let color = cachedFolders[lastFolder].color.split(")");
    document.getElementById(id).style.background = `${color} 0.15)`;
  } else {
    document.getElementById(id).style.background = `var(--accent)`;
  }

  document.getElementById("Command_Description").value = botData.folders[id].description || "";

  lastHighlightedType = 2;

  document.getElementById("groupType").innerText = strings.editor.command_name_labels.folder;
  document.getElementById("Command_Name").innerText = cachedFolders[lastFolder].name;
  document.getElementById('actionbar').style.background = ''
  document.getElementById('actiontoolbar').style.background = ''
}

function colorize(element, at, type) {
  let color;
  if (element.id.startsWith("Group")) {
    if (!botData.commands[at].color) return;
    color = botData.commands[at].color.split(")");
  } else {
    if (!cachedFolders[at]?.color) return;
    color = cachedFolders[at].color.split(")");
  }

  let intensity;

  if (element.id.startsWith("Group")) {
    switch (type) {
      case 1:
        intensity = '0.18'
        break

      case 2:
        if (lastObj == at) {
          intensity = '0.15'
        } else {
          intensity = '0.09'
        }
        break

      case 3:
        intensity = '0.20'
        break

      case 4:
        if (lastObj == at) {
          intensity = '0.17'
        } else {
          intensity = '0.9'
        }
        break
    }
    element.style.background = `${color} ${intensity})`;
  } else {
    switch (type) {
      default:
        // hover
        intensity = "0.15";
        break;

      case 2:
        // hover leave
        if (lastFolder == at) {
          intensity = "0.20";
        } else {
          intensity = "0.1";
        }
        break;

      case 3:
        intensity = "0.25";
        break;

      case 4:
        intensity = "0.10";
        break;
    }
    element.style.background = `${color} ${intensity})`;
  }

}

let commandParameters = document.getElementById("commandParameters");
let groupOptions = document.getElementById("commandOptions");
let groupEvents = document.getElementById("groupEvents");
function resetElements() {
  groupOptions.style.width = ``;
  groupOptions.style.opacity = ``;
  groupOptions.style.padding = ``;

  groupEvents.style.padding = "0px";
  groupEvents.style.opacity = "0%";
  groupEvents.style.width = "0%";
  groupEvents.innerHTML = ``;

  commandParameters.style.padding = ``;
  commandParameters.style.width = ``;
  commandParameters.style.marginRight = ``;
  commandParameters.style.opacity = ``;
}

resetElements();

function prioritizeCommandOptions() {
  resetElements();

  commandParameters.style.width = `0%`;
  commandParameters.style.padding = `0px`;
  commandParameters.style.opacity = `0%`;
  commandParameters.style.marginRight = "0px";

  groupOptions.style.width = "calc(100% - 4px)";
  groupOptions.style.marginRight = `0px`;
}

function prioritizeEvents() {
  resetElements();

  groupOptions.style.width = `0%`;
  groupOptions.style.paddingTop = `0px`;
  groupOptions.style.paddingBottom = `0px`;
  groupOptions.style.opacity = `0%`;
  groupOptions.style.marginRight = `0px`;
  commandParameters.style.width = `0%`;
  commandParameters.style.padding = `0px`;
  commandParameters.style.opacity = `0%`;
  commandParameters.style.marginRight = "0px";

  groupEvents.style.padding = "";
  groupEvents.style.width = "calc(100% - 4px)";
  groupEvents.style.opacity = "";

  try {
    groupEvents.innerHTML = `
    <div style="margin: auto; margin-left: 10px;">${getString(strings.editor.event, [require(`${processPath}/AppData/Events/${botData.commands[lastObj].eventFile}`).name])}</div>
    <div class="image openExternally" style="margin-right: 10px; width: 20.7px;"></div>
    `
  } catch (err) {
    groupEvents.innerHTML = `<div style="margin: auto; margin-left: 10px;">${getString(strings.editor.event, [strings.editor.none])}</div><div class="image openExternally"></div>`;
  }
}

function returnToNormal() {
  resetElements();
}

let lastHighlightedType = 0; // 0 = Group - 1 = Action - 2 = Folder

let isHoldingCTRL = false;

document.addEventListener('keydown', (key) => {
  isHoldingCTRL = key.ctrlKey
})
document.addEventListener('keyup', (key) => {
  isHoldingCTRL = key.ctrlKey
})

async function highlight(element) {
  if (lastFolder) {
    showTypeDropdown()
    document.getElementById('actionbar').classList.remove('flexbox');
    try {
      if (cachedFolders[lastFolder].color) {
        let color = cachedFolders[lastFolder].color.split(")");
        document.getElementById(lastFolder).style.background = `${color} 0.10)`;
      } else {
        document.getElementById(lastFolder).style.background = "";
      }
      document.getElementById(lastFolder).classList.remove('highlighted');
    } catch (err) { }
    lastFolder = undefined;
  }
  try {
    if (element.id.startsWith("Group")) {
      selectedActions = []
      lastType = 0;
      setTimeout(() => {
        lastHighlightedType = 0;
      }, 1500);

      showEditorSpecifics(
        botData.commands[element.id.split("Group")[1]].type == "event"
      );
      try {
        document.getElementById(`Group${lastObj}`).classList.remove('highlighted');

        if (botData.commands[lastObj].color != undefined) {
          document.getElementById(`Group${lastObj}`).style.background = botData.commands[lastObj].color.split(")") + " 0.09)";
        } else {
          document.getElementById(`Group${lastObj}`).style.background = "";
        }
      } catch (err) { }

      element.style.background = "var(--accent)";
      lastObj = element.id.split("Group")[1];

      document.getElementById("Command_Name").innerText = botData.commands[lastObj].name;
      document.getElementById("Command_Description").value = botData.commands[lastObj].description || "";

      if (!editorSettings.focus) {
        document.getElementById("actionsOf").innerHTML = getString(strings.editor.actions_of, [botData.commands[lastObj].name]);
      } else {
        document.getElementById("actionsOf").innerHTML = `${botData.commands[lastObj].name}`;
      }


      if (botData.commands[lastObj].color != undefined) {
        element.style.background = botData.commands[lastObj].color.split(")") + " 0.15)";
      }

      refreshActions();
      let group = botData.commands[lastObj];

      if (botData.commands[lastObj].type == "action") {
        if (botData.commands[lastObj].trigger != 'slashCommand') {
          prioritizeCommandOptions();
        }

        document.getElementById('requiredPermissions').innerHTML = group.boundary?.limits.length || strings.misc.none;

        switch (botData.commands[lastObj].trigger) {
          case "slashCommand":
            resetElements();
            hideAliases();
            document.getElementById('parameterCount').innerHTML = group.parameters?.length || strings.misc.none;
            break;
          case "textCommand":
            showAliases();
            break;
          case "messageContent":
            showAliases();
            break;
          case "message":
            hideAliases();
            break
          case "user":
            hideAliases();
            break
        }
      } else {
        prioritizeEvents();
        hideAliases();
      }

      document.getElementById("groupType").innerText = strings.editor.command_name_labels[botData.commands[lastObj].trigger];

      if (editorSettings.groupColorAppliesToActions == 'On') {
        if (!botData.commands[lastObj].color) {
          document.getElementById('actionbar').style.background = ''
          document.getElementById('actiontoolbar').style.background = ''
        } else {
          document.getElementById('actionbar').style.background = `${botData.commands[lastObj].color.split(')')} 0.10)`
          document.getElementById('actiontoolbar').style.background = `${botData.commands[lastObj].color.split(')')} 0.08)`
        }
      }

      let typeManager = document.getElementById("typeOfGroup");
      let types = {
        messageContent: "Message Content",
        textCommand: "Text Command",
        slashCommand: "Slash Command",
        message: "Message Command",
        user: "User Command"
      };

      if (isTypeManagerOpen) {
        typeManager.onclick();
      } else {
        typeManager.onclick = () => {
          dropTypes();
        };
      }

      typeManager.innerHTML = `${types[botData.commands[lastObj].trigger] || "No Type Available"}`

      lastHighlightedType = 0;

      let r, g, b;

      let command = botData.commands[lastObj];
      document.getElementById(`Group${lastObj}`).classList.add('highlighted');
    } else {
      lastHighlightedType = 1;
      lastType = 1;
      try {
        if (!isHoldingCTRL) {
          document.getElementById(`Action${lastAct}`).style.background = "";
          document.getElementById(`Action${lastAct}`).classList.remove('highlighted');
        }
      } catch (err) {}

      if (isHoldingCTRL && lastAct != element.id.split("Action")[1] && selectedActions.length == 0) {
        selectedActions.push(lastAct)
      }

      lastAct = element.id.split("Action")[1];

      if (!isHoldingCTRL) {
        if (selectedActions.length != 0) {
          refreshActions()
        }
        selectedActions = [];
        document.getElementById(`Action${lastAct}`).classList.add('highlighted');
      } else {
        let eID = element.id.split("Action")[1];
        if (selectedActions.length == 0 && eID != lastAct) {
          selectedActions.push(lastAct)
        }
        if (selectedActions.includes(eID)) {
          element.classList.remove('highlighted');
          selectedActions.splice(selectedActions.indexOf(eID), 1)
        } else {
          selectedActions.push(eID);
          document.getElementById(`Action${lastAct}`).classList.add('highlighted');
        }
      }
    }
  } catch (err) {}
}

(Element.prototype.appendBefore = function (element) {
  element.parentNode.insertBefore(this, element);
}),
  false;
(Element.prototype.appendAfter = function (element) {
  element.parentNode.insertBefore(this, element.nextSibling);
}),
  false;

let timesSaved = 0;

function setCommandColor(r, g, b) {
  client.achievement.activate('RAINBOWS')
  if (lastFolder) {
    if (r == '255' && g == '255' && b == '255') {
      botData.folders[lastFolder].color = null
      cachedFolders[lastFolder].color = null
    } else {
      botData.folders[lastFolder].color = `rgb(${r}, ${g}, ${b})`
      cachedFolders[lastFolder].color = `rgb(${r}, ${g}, ${b})`
    }
    saveLocally();
    checkSaveStatus();
    colorize(document.getElementById(lastFolder), lastFolder, 1);
  } else {
    if (r == '255' && g == '255' && b == '255') {
      botData.commands[lastObj].color = null
    } else {
      botData.commands[lastObj].color = `rgb(${r}, ${g}, ${b})`
    }
    saveLocally();
    checkSaveStatus();

    colorize(document.getElementById(`Group${lastObj}`), lastObj, 1);
  }
}

function savePrj() {
  timesSaved++
  try {
    fs.writeFileSync(
      botData.prjSrc + "/AppData/data.json",
      JSON.stringify(botData, null, 2)
    );
  } catch (err) { }


  document.getElementById("saveStatus").style.filter = `blur(12px)`

  setTimeout(() => {
    document.getElementById("saveStatus").innerText = strings.editor.save_states[1];
    document.getElementById("saveStatus").style.filter = `blur(0px)`
  }, editorSettings.fastAnimation * 100);
  lastKnownStatus = true;

  document.getElementById("saveIcon").style.transform = '';

  saveLocally();
  if (timesSaved > 40) {
    client.achievement.activate('SAFETY_FIRST');
  }

  if (ownSettings.restartOnSave != 'Off' && isBotOn) {
    toggleBotStatus()
    setTimeout(() => {
      toggleBotStatus()
    }, 500);
  }
}

let lastKnownStatus;
function checkSaveStatus() {
  document.getElementById("saveStatus").style.transition = `all 0.${editorSettings.fastAnimation}s ease`

  if (fs.readFileSync("./AppData/data.json", "utf8") == fs.readFileSync(`${botData.prjSrc}/AppData/data.json`, "utf8")) {
    document.getElementById("saveIcon").style.transform = '';
    if (lastKnownStatus == true) return true;

    lastKnownStatus = true

    document.getElementById("saveStatus").style.filter = `blur(12px)`

    setTimeout(() => {
      document.getElementById("saveStatus").innerText = strings.editor.save_states[1];
      document.getElementById("saveStatus").style.filter = `blur(0px)`
    }, editorSettings.fastAnimation * 100);

    return true;
  } else {
    document.getElementById("saveIcon").style.transform = 'translateY(12px)';
    if (lastKnownStatus == false) return false;
    lastKnownStatus = false;
    document.getElementById("saveStatus").style.filter = `blur(12px)`

    setTimeout(() => {
      document.getElementById("saveStatus").innerText = strings.editor.save_states[0];
      document.getElementById("saveStatus").style.filter = `blur(0px)`
    }, editorSettings.fastAnimation * 100);

    return false;
  }
}


function openEvent() {
  try {
    ipcRenderer.send("editEvent", {
      name: require(processPath +
        "/AppData/Events/" +
        botData.commands[lastObj].eventFile).name,
      event: botData.commands[lastObj].eventFile,
      data: botData.commands[lastObj].eventData,
    });
  } catch (err) {
    ipcRenderer.send("editEvent", {
      name: "Bot Ready",
      event: "bot_ready.js",
      data: [""],
    });
  }
}

function openPermissionEditor() {
  ipcRenderer.send("openPerms", botData.commands[lastObj]);
  ipcRenderer.once("boundaryData", (event, data) => {
    createCheckpoint()
    botData.commands[lastObj].boundary = data;
    highlight(document.getElementById(`Group${lastObj}`));
  });
}

function setGroupColor(elm) {

  createCheckpoint();
  if (lastFolder) {
    if (elm == null) {
      botData.folders[lastFolder].color = null;
      cachedFolders[lastFolder].color = null;
      saveLocally();
      document.getElementById(lastFolder).classList.remove('coloredAction')
      document.getElementById(lastFolder).classList.add('action')
      document.getElementById(lastFolder).style.background = `#ffffff25`
      return;
    }
    let color = elm.style.background;
    cachedFolders[lastFolder].color = color;
    botData.folders[lastFolder].color = color;
    document.getElementById(lastFolder).classList.remove('action')
    document.getElementById(lastFolder).classList.add('coloredAction')
    saveLocally();

    document.getElementById(lastFolder).style.background = `${cachedFolders[lastFolder].color.split(')')} 0.20`;
    recacheFolders()
  } else {
    const last = `${lastObj}`;
    if (elm == null) {
      botData.commands[lastObj].color = undefined;
      refreshGroups();
      return;
    }
    let color = elm.style.background;
    botData.commands[lastObj].color = color;
    refreshGroups();
    saveLocally();
  }

  if (editorSettings.focus) {
    toggleColorsVisibility()
  }

  client.achievement.activate('RAINBOWS');
}

function toggleColorsVisibility() {
  return
  if (botData.colorsVisibility == undefined) {
    botData.colorsVisibility = false;
  }
  if (botData.colorsVisibility == true) {
    document.getElementById("colorsSelector").style.width = "0%";
    document.getElementById("colorsSelector").style.marginLeft = "-10px";
    document.getElementById("colorsSelector").style.paddingLeft = "0px";
    document.getElementById("colorsSelector").style.paddingRight = "0px";

    setTimeout(() => {
      document.getElementById("colorsSelector").style.marginLeft = "";
    }, 250);
    botData.colorsVisibility = false;
  } else {
    document.getElementById("colorsSelector").style.marginLeft = "";
    document.getElementById("colorsSelector").style.width = "calc(100% - 55px)";
    document.getElementById("colorsSelector").style.paddingLeft = "3px";
    document.getElementById("colorsSelector").style.paddingRight = "3px";
    setTimeout(() => {
      document.getElementById("colorsSelector").style.width = "calc(100% - 55px - 10px)";
    }, 250);
    botData.colorsVisibility = true;
  }
  saveLocally();
}

function saveLocally() {
  fs.writeFileSync(
    "./AppData/data.json",
    JSON.stringify(botData, null, 2)
  );


  document.getElementById("saveStatus").innerText = "Saved";
  document.getElementById("saveIcon").style.transform = '';
}

let lastNotification;
let handlingLastNotification = false;

async function notify(text) {
  if (lastNotification) {
    await new Promise(res => {
      lastNotification.style.opacity = '0'
      lastNotification.style.scale = '2.2'
      res();

      setTimeout(() => {
        lastNotification.remove();
      }, 100);
    })
  }
  let popup = document.createElement('div')
  popup.style.position = 'fixed'
  document.body.appendChild(popup);

  popup.innerHTML = `<btext>${text}</btext>`;
  popup.style.marginTop = ''
  popup.style.marginRight = '-100vw'
  popup.style.padding = '10px'
  popup.style.borderRadius = '9px'
  popup.style.transition = 'all 0.2s ease, margin-top 0.3s cubic-bezier(.4,.16,.14,1.4), margin-left 0.3s cubic-bezier(.4,.16,.14,1.4), height 0.3s ease, scale 0.4s cubic-bezier(.4,.16,.14,1.4)'
  popup.style.backdropFilter = 'blur(12px)'
  popup.style.background = '#ffffff10'
  popup.style.scale = '0.2'

  setTimeout(() => {
    popup.style.scale = '1'
    lastNotification = popup;
  }, 100);


  setTimeout(() => {
    popup.style.opacity = '0'
    popup.style.scale = '2.2'
    setTimeout(() => {
      popup.remove()
    }, 300);
  }, 4000);

  return popup
}

let usedCustomIds = [];
for (let command in botData.commands) {
  if (botData.commands[command]) {
    if (usedCustomIds.includes(botData.commands[command].customId)) {
      botData.commands[command].customId =
        parseFloat(new Date().getTime()) + parseFloat(usedCustomIds.length);
    } else {
      usedCustomIds.push(botData.commands[command].customId);
    }
  }
}
saveLocally();

async function closeEditor() {
  if (checkSaveStatus() == false) {
    let keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: strings.editor.exit_unsaved_confirmation }, 'deletionModalInteraction');
    if (!keepGoing) return;
  }
  ipcRenderer.send("close");
}


async function uploadToWorkshop(content, type) {
  if (type == 0) {
    const customId = botData.commands[content].customId;
    let keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: `Are you sure you want to upload ${botData.commands[content].name} to the Steam Workshop?` }, 'deletionModalInteraction');
    if (!keepGoing) return;

    client.workshop.createItem(appID).then(e => {
      client.workshop.updateItem(e.itemId, {
        changeNote: "Add content",
        title: `${botData.commands[lastObj].name} (${botData.commands[lastObj].type == 'action' ? "command" : "event"})`,
        contentPath: "./Workshop_Items/Command"
      }).then(e => {
        console.log(e);
        client.workshop.getItem(e.itemId).then(aaaaaaaaaa => {
          console.log(aaaaaaaaaa)
        })
      })
    }).catch(err => console.log(err));

    const fse = require('fs-extra');

    try {
      if (!fs.existsSync(`./Workshop_Items/${customId}`)) {
        fse.copySync('./Workshop_Items/Command', `./Workshop_Items/${customId}`)
      }
    } catch (error) {
      return notify('Something went wrong, sorry!');
    }

    try {
      client.workshop.createItem().then(workshopItem => {
        console.log('created!')
        client.workshop.updateItem(workshopItem.itemId, {
          contentPath: `./Workshop_Items/${customId}`,
          tags: ["383217"]
        })
      });
    } catch (error) {
      console.log(error);
      notify('Upload Failed..');
    }
  }
}

function resizeCommands() {
  let ids = ['commandbar', 'edutor', 'actionbar', 'toggleSizing'];
  ids.forEach(id => {
    document.getElementById(id).style.transition = `all 0.${editorSettings.commonAnimation}s cubic-bezier(.17,.67,0,1.38)`
  })

  if (!botData.collapsed) {
    document.getElementById('commandbar').style.height = 'var(--collapsedCommandContainerHeight)'
    document.getElementById('actionbar').style.height = 'var(--expandedActionContainerHeight)'
    document.getElementById('toggleSizing').style.rotate = '90deg'
    botData.collapsed = true;
  } else {
    document.getElementById('commandbar').style.height = 'var(--commandContainerHeight)'
    document.getElementById('actionbar').style.height = 'var(--actionContainerHeight)'
    document.getElementById('edutor').style.height = ''
    document.getElementById('edutor').style.width = ''
    document.getElementById('edutor').style.marginBottom = ''
    botData.collapsed = false;
    document.getElementById('toggleSizing').style.rotate = '-90deg'
  }
  saveLocally();
  checkSaveStatus();
}

resizeCommands();
resizeCommands();

// document.getElementById('windowControls').appendBefore(document.getElementById('logo_toolbar'))