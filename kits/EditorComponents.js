let lastHoveredContainer;
let draggedOverMenu, draggedPosition, draggedOverPosition;
let timing;
let customIDsCalculated = 0;

function addObjectToMenu(element, option, hlLast) {
  setTimeout(() => {
    document.getElementById(actionUI[element].storeAs).classList.remove('flexbox');
  }, editorSettings.commonAnimation * 100);

  if (actionUI[element].max > action.data[actionUI[element].storeAs].length) {
    action.data[actionUI[element].storeAs].push({
      type: option,
      data: actionUI[element].UItypes[option].data,
    });
  }
  refreshMenuItems(element, true, hlLast ? true : false);
  document.getElementById(`${element}AddButton`).style.transition = `all 0.${editorSettings.commonAnimation}s ease`

  if (actionUI[element].max != 1) {
    document.getElementById(`${element}AddButton`).style.transform = "rotate(360deg)";
    setTimeout(() => {
      document.getElementById(`${element}AddButton`).style.transform = "rotate(0deg)";
      document.getElementById(`${element}AddButton`).style.transition = `all 0s ease`
    }, editorSettings.commonAnimation * 200);
  }

  if (editorSettings.editMenusOnCreation) {
    openPopupOption(action.data[actionUI[element].storeAs].length - 1, element, { picker: true });
  }
}

function recacheOwnVariables() {
  let rescraped = scrapeForVariables(actionUI, action.data, true);

  tempVars = rescraped.temp;
  thisGlobal = rescraped.global;
  thisServer = rescraped.server;
}

let scrapeForVariables = (UI, data, pullTemp) => {
  let localGlobal = [];
  let localServer = [];
  let localTemp = [];

  try {
    for (let i in UI) {
      let element = UI[i];
      if (element.element == 'storageInput' || element.element == 'storage' || element.element == 'store') {
        if (data[element.storeAs].type == 'global') {
          localGlobal.push(data[element.storeAs].value);
        } else if (data[element.storeAs].type == 'server') {
          localServer.push(data[element.storeAs].value);
        } else if (data[element.storeAs].type == 'temporary' && (pullTemp == undefined || pullTemp == true)) {
          localTemp.push(data[element.storeAs].value);
        }
      }

      if (element.element == 'menu') {
        for (let menu in data[element.storeAs]) {
          let scraped = scrapeForVariables(element.UItypes[data[element.storeAs][menu].type].UI, data[element.storeAs][menu].data, element.UItypes[data[element.storeAs][menu].type].pullVariables);
          localTemp = [...localTemp, ...scraped.temp]
          localServer = [...localServer, ...scraped.server]
          localGlobal = [...localGlobal, ...scraped.global]
        }
      }

      if (element.element == "case" || element.element == "condition") {
        if (data[element.storeAs].type == "runActions") {
          for (let i in data[element.storeActionsAs]) {
            let action = data[element.storeActionsAs][i];
            try {
              let act = allActions[action.file];
              let scraped = scrapeForVariables(act.UI, action.data);
              localTemp = [...localTemp, ...scraped.temp]
              localServer = [...localServer, ...scraped.server]
              localGlobal = [...localGlobal, ...scraped.global]
            } catch (err) { }
          }
        }
      }

      if (element.element == 'actions') {
        for (let i in data[element.storeAs]) {
          let action = data[element.storeAs][i];
          try {
            let act = allActions[action.file];
            let scraped = scrapeForVariables(act.UI, action.data);
            localTemp = [...localTemp, ...scraped.temp]
            localServer = [...localServer, ...scraped.server]
            localGlobal = [...localGlobal, ...scraped.global]
          } catch (err) { }
        }
      }
    }
  } catch (err) { }
  return { global: localGlobal, server: localServer, temp: localTemp }
}


function openPopupOption(object, index) {
  let vars = scrapeForVariables(actionUI[index].UItypes[action.data[actionUI[index].storeAs][object].type].UI, action.data[actionUI[index].storeAs][object].data, true);
  
  let data = action.data[actionUI[index].storeAs][object].data;
  if (actionUI[index].UItypes[action.data[actionUI[index].storeAs][object].type].inheritData == true) {
    data = action.data;
  }

  ipcRenderer.send(`${time}`, {
    event: "openCustom",
    data,
    UI: actionUI[index].UItypes[action.data[actionUI[index].storeAs][object].type].UI,
    name: actionUI[index].UItypes[action.data[actionUI[index].storeAs][object].type].name,
    variables: {
      commandVars: [...commandVars, ...tempVars],
      temporary: vars.temp,
      server: [...serverVars],
      global: [...globalVars],
      thisGlobal: vars.global,
      thisServer: vars.server
    },
    actionType: actionType,
  });

  ipcRenderer.once("menuData", (event, data, copied) => {
    if (actionUI[index].UItypes[action.data[actionUI[index].storeAs][object].type].inheritData) {
      action.data = data;
    } else {
      action.data[actionUI[index].storeAs][object].data = data;
    }
    recacheOwnVariables();
    refreshMenuItems(index);
  });
}


function editAction(at, actionNumber, options) {
  let vars = scrapeForVariables(ipcActionCache[action.data[at][actionNumber].file].UI, action.data[at][actionNumber]);
  let customId = new Date().getTime();
  ipcRenderer.send("editAction", {
    event: "openAction",
    variables: {
      commandVars: vars.temp,
      temporary: [...commandVars, ...tempVars],
      server: [...thisServer, ...serverVars],
      global: [...thisGlobal, ...globalVars],
      thisGlobal: vars.global,
      thisServer: vars.server
    },
    actionType: actionType,
    customId: `${customId}`,
    actions: action.data[at],
    action: actionNumber,
    options: (options || { picker: false })
  });
  function storeActionData() {
    ipcRenderer.once(`childSave${customId}`, (event, data, copied) => {
      action.data[at][actionNumber] = data;
      storeActionData();
      recacheOwnVariables();

      refreshActions(at);
    });
  }
  storeActionData();
}

recacheOwnVariables();


function handleOptionDrag(position, menu) {
  draggedPosition = position;
  draggedOverMenu = menu;
}

function dragPositionOver(position, menu, event) {
  if (draggedOverMenu == menu) event.preventDefault()

  draggedOverPosition = position;
}

function handleDragOptionEnd() {
  console.log(actionUI[draggedOverMenu], draggedOverMenu)
  action.data[actionUI[draggedOverMenu].storeAs] = moveArrayElement(action.data[actionUI[draggedOverMenu].storeAs], draggedPosition, draggedOverPosition);
  refreshMenuItems(draggedOverMenu)
  draggedOverMenu = undefined;
}


async function refreshMenuItems(menu, fade, fadeLast) {

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


  await new Promise(res => {
    if (document.getElementById(`${actionUI[menu].storeAs}_Options`)) {
      document.getElementById(`${actionUI[menu].storeAs}_Options`).style.opacity = '0'
      setTimeout(() => {
        res()
      }, editorSettings.fastAnimation * 100);
    } else {
      res()
    }
  });

  let menuObject = actionUI[menu];
  let menuElement = document.getElementById(menuObject.storeAs);


  if (menuObject.max != 1) {
    if (!action.data[menuObject.storeAs].length) {
      menuElement.style.height = "37px";
    } else {
      menuElement.style.height = "150px";
    }

    if (!highlights[menuObject.storeAs]) {
      highlights[menuObject.storeAs] = { highlighted: 0, menu, selected: [], type: 2 }
    }

    if (!action.data[menuObject.storeAs][highlights[menuObject.storeAs].highlighted] && highlights[menuObject.storeAs].highlighted != 0) {
      highlights[menuObject.storeAs].highlighted = 0;
    }

    let endOptions = ``;

    for (let object in action.data[menuObject.storeAs]) {
      let option = action.data[menuObject.storeAs][object];
      let typeName = actionUI[menu].UItypes[option.type].name;

      let preview = '';
      try {
        if (actionUI[menu].UItypes[option.type].preview) {
          preview = eval(actionUI[menu].UItypes[option.type].preview)
        }
      } catch (err) { }

      let previewText = '';
      let previewLength = 0;

      previewText.replaceAll('<', '<​')

      let deco = ``

      if (action.data[menuObject.storeAs][Number(object) + 1] && actionUI[menu].path) {
        deco = `
      <div class="image arrow" style="width: 30px; aspect-ratio: 1/1; rotate: 180deg; margin-top: 4px; margin-bottom: 4px;"></div>
      `
      }

      let additionalClass = ``
      if (highlights[menuObject.storeAs]?.highlighted == object) {
        additionalClass = `highlighted`
      }

      let fadeNow = false;

      if (fade && !fadeLast) {
        fadeNow = true;
      } else if (fade && fadeLast) {
        fadeNow = action.data[menuObject.storeAs].length - 1 == object;
      }



      endOptions += `
      <div class="action textToLeft flexbox ${fadeNow ? "fade" : ""} ${additionalClass}" onclick="highlightMenu(${menu}, ${object})" id="menu${menu}object${object}"
      ondblclick="openPopupOption('${object}', '${menu}')" style="animation-duration: 0.${editorSettings.commonAnimation}s !important;"
      draggable="true"
      ondragend="handleDragOptionEnd()" ondragover="dragPositionOver(${object}, '${menu}', event)" ondragstart="handleOptionDrag(${object}, '${menu}')"
      onmouseenter="lastHoveredMenu = {menu: ${menu}, object: ${object}}" onmouseleave="lastHoveredMenu = null">

      <text class="indicator">${editorSettings.focus ? "" : "#"}${parseFloat(object) + 1}</text>
      <div style="margin-right: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 24px; max-width: 200px !important;">${actionUI[menu].UItypes[option.type].name.substring(0, 256)}</div>

      <div style="flex-grow: 1; opacity: 0; display: ${leftSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>
      <div style="max-width: 50vw; min-width: 0vw; overflow: hidden;">
      <span style="margin-left: 5px; margin-right: 5px; ${subtitlePosition}; opacity: ${editorSettings.focus ? "30" : '50'}%; width: 100%; height: 24px; display: block; text-overflow: ellipsis;">${preview.replaceAll("", "​")}</span>
      </div>
      <div style="flex-grow: 1; opacity: 0; display: ${rightSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>

      <div class="deleteActionButton flexbox ${editorSettings.focus ? "noShow" : ''}" onclick="deleteMenuOption('${object}', '${menu}')" style="margin-left: 1vw;"><div class="image trash"></div></div>
      </div>
      ${deco}
    `
    }
    setTimeout(() => {
      menuElement.innerHTML = `<div class="flexbox" style="align-items: center; justify-content: center;">${endOptions}</div>`;
      if (!endOptions) {
        menuElement.innerHTML = `
      <span class="fade flexbox" style="animation-duration: 0.${editorSettings.fastAnimation}s; height: 100%; transition: all 0.${editorSettings.fastAnimation}s ease;">
      <btext style="position: relative; margin: auto; opacity: 0.5;" class="${editorSettings.focus ? "noShow" : ""}">No ${menuObject.name} Yet</btext>
      <div style="margin-top: 4px; rotate: 90deg; margin-left: auto; margin-right: 10px; width: 30px; height: 30px; transition: all 0.${editorSettings.fastAnimation}s ease" class="image backArrow SmallBrain"></div>
      </span>`
      }
    }, editorSettings.commonAnimation * 50);
    document.getElementById(`${menu}AddButton`).style.transform = "rotate(0deg)";

    setTimeout(() => {
      document.getElementById(`${menu}AddButton`).style.transition = "";
      document.getElementById(`${menu}AddButton`).style.transition = `all 0.${editorSettings.commonAnimation}s cubic-bezier(.17,.67,.6,1.34)`
      document.getElementById(`${menu}AddButton`).parentElement.onclick = () => {
        addObjectToCustomMenu(menu, true);
      };
    }, editorSettings.commonAnimation * 50);
  } else {
    if (action.data[menuObject.storeAs][0]) {
      let UItype = Object.keys(menuObject.UItypes)[0];
      let previewText = ``

      try {
        let preview = '';
        let data = action.data[menuObject.storeAs][0];


        try {
          if (actionUI[menu].UItypes[UItype].preview) {
            let option = { data }
            preview = eval(actionUI[menu].UItypes[UItype].preview);
          }
        } catch (err) { }

        let previewLength = 0;

        if (preview.length > 35) {
          for (let character of preview.split('')) {
            if (previewLength < 35) {
              const opacity = 100 - (previewLength - 25) * 10;
              previewText += `<span style="opacity: ${opacity}%;">${character}</span>`;
              previewLength++
            }
          }
        } else {
          previewText = preview;
        }

        previewText.replaceAll('<', '<​')
      } catch (error) { }

      menuElement.innerHTML = `
      <div class="menu flexbox ${(fade || fadeLast) ? "fade" : ""}" onclick="highlightMenu(${menu}, 0); openPopupOption('0', '${menu}')" id="menu${menu}object0"
      style="animation-duration: 0.${editorSettings.commonAnimation}s !important; height: 25px; margin-bottom: 0px; margin-top: 0px; ${actionUI[menu].required ? "width: calc(100% - 10px);" : ""}" onmouseenter="lastHoveredMenu = {menu: ${menu}, object: 0}" onmouseleave="lastHoveredMenu = null">
        <div style="margin-left: 5px;" class="flexbox">
        <div class="image openExternally" style="margin-right: 10px; width: 20px; height: 20px;"></div>
        <btext>${menuObject.UItypes[UItype].name}</btext>
        </div>

        <btext style="opacity: 50%; margin-right: auto; margin-left: 10px; text-align: left; max-width: 50vw;">${previewText}</btext>
      </div>
    `
      document.getElementById(`${menu}AddButton`).parentElement.onclick = () => {
        deleteMenuOption(0, menu, true);
      };
      document.getElementById(`${menu}AddButton`).style.rotate = "225deg";
    } else {
      document.getElementById(`${menu}AddButton`).style.rotate = "0deg";

      menuElement.innerHTML = `
      <span class="fade flexbox" id="${actionUI[menu].storeAs}_Options" style="animation-duration: 0.${editorSettings.fastAnimation}s; height: 100%; transition: all 0.${editorSettings.fastAnimation}s ease;">
      <btext style="position: relative; margin: auto; opacity: 0.5;" class="${editorSettings.focus ? "noShow" : ""}">No ${menuObject.name} Yet</btext>
      <div style="margin-top: auto; margin-bottom: auto; rotate: 180deg; margin-left: auto; margin-right: 10px; width: 30px; height: 30px; transition: all 0.${editorSettings.fastAnimation}s ease" class="image backArrow SmallBrain"></div>
      </span>`
      document.getElementById(`${menu}AddButton`).parentElement.onclick = () => {
        addObjectToCustomMenu(menu, true);
      };
    }
  }
}

async function highlightMenu(menu, object) {
  let rawMenu = actionUI[menu];
  lastContainer = rawMenu.storeAs;

  let currentSelection = [];
  let skipBackgroundAddition = false;

  if (highlights[rawMenu.storeAs]) {
    currentSelection = highlights[rawMenu.storeAs].selected;
    if (currentSelection.length != 0) {
      if (!isHoldingCTRL) {
        highlights[rawMenu.storeAs].highlighted = object;
        currentSelection = [];
        await refreshMenuItems(menu);
      } else {
        if (currentSelection.includes(object)) {
          let lastHighlightedMenu = document.getElementById(`menu${menu}object${object}`);
          lastHighlightedMenu.classList.remove('highlighted')
          skipBackgroundAddition = true;
          currentSelection.splice(currentSelection.indexOf(object), 1);
          return
        }
      }
    } else {
      if (!isHoldingCTRL) {
        let oldMenu = highlights[rawMenu.storeAs];
        try {
          let lastHighlightedMenu = document.getElementById(`menu${oldMenu.menu}object${oldMenu.highlighted}`);
          lastHighlightedMenu.classList.remove('highlighted')
        } catch (error) { }
      }
    }
  }

  if (isHoldingCTRL) {
    if (currentSelection.length == 0 && highlights[rawMenu.storeAs].highlighted != object) {
      currentSelection.push(highlights[rawMenu.storeAs].highlighted)
    }
    currentSelection.push(object)
  }

  if (!skipBackgroundAddition) {
    let newMenu = document.getElementById(`menu${menu}object${object}`);
    newMenu.classList.add('highlighted')
  }


  highlights[rawMenu.storeAs] = { highlighted: object, selected: currentSelection, type: 2, menu };
}

function createAction(at) {
  customIDsCalculated++
  let newAct = {
    name: "Send Message",
    file: "sendmessage.js",
    data: {
      "name": "Send Message",
      "messageContent": "Hello World!",
      "actionRows": [],
      "embeds": [],
      channel: {
        type: "command",
        value: ""
      },
      storeAs: {
        value: "",
        type: "temporary"
      },
      replyToInteraction: true
    },
    id: customIDsCalculated + new Date().getTime()
  };

  action.data[at].push(newAct);
  refreshActions(at);

  if (editorSettings.editActionsOnCreation) {
    editAction(at, action.data[at].length - 1, { picker: true });
  }
}


function refreshActions(at) {
  if (!highlights[at]) {
    highlights[at] = { highlighted: 0, selected: [], type: 1 };
  }
  action.data[at] = action.data[at].filter(action => action != null)

  document.getElementById(at).innerHTML = "";
  let endHTML = '';
  let endActions = []

  for (let a in action.data[at]) {
    let Action = action.data[at][a];
    let actionData;
    let endAction = {
      subtitle: '',
      found: false,
      file: Action.file,
      borderType: 'bordercentere'
    }
    try {
      actionData = require(`${processPath}/AppData/Actions/${Action.file}`);
    } catch (err) { }

    // if (action.data[at][parseFloat(a) - 1] == undefined) {
    //   endAction.borderType = "bordertop";
    // } else if (action.data[at][parseFloat(a) + 1] == undefined) {
    //   endAction.borderType = "bordertop";
    // }



    if (actionData) {
      endAction.found = true;
      endAction.name = Action.name;
      try {
        if (actionData.subtitle) {
          if (typeof actionData.subtitle == 'function') {
            endAction.subtitle = actionData.subtitle(Action.data, {
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
                return Action.data[dataName];
              },
            );
          }
        }
      } catch (err) { }
    } else {
      endAction.name = Action.name
    }

    endAction.subtitle = endAction.subtitle?.replaceAll('<', '<​')

    endActions.push(endAction)
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

  endActions.forEach((Action, index) => {
    let errors = ''

    if (Action.found == false) {
      errors = `
      <div style="background: #00000040; padding: 3px; font-size: 13px; margin: auto; margin-left: 1vw; border-radius: 6px;">Action Not Found!</div>
    `
    }
    endHTML += `
      <div class="action textToLeft ${Action.borderType}"
      ondblclick="editAction('${at}', '${index}')"
      onclick="highlightAction('${at}', ${index})"
      onmouseenter="lastHovered = ${index}"
      draggable="true"
      ondragleave="handleActionDragEnd('${at}', '${index}')"
      ondragend="handleActionDrop('${at}', '${index}')"
      ondragover="actionDragOverHandle(event, '${at}', '${index}')"
      ondragstart="handleActionDrag('${at}', '${index}')"
      onmouseleave="lastHovered = null;"
      style="animation-duration: 0.2s;"
      onmouseleave="lastHovered = null;"
      id="${at}Action${index}">

      <text class="indicator">${editorSettings.focus ? "" : "#"}${parseFloat(index) + 1}</text>
      <div style="margin-right: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 24px; max-width: 200px !important;">${Action.name.substring(0, 256)}</div>
      ${errors}
      <div style="flex-grow: 1; opacity: 0; display: ${leftSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>
      <div style="max-width: 50vw; min-width: 0vw; overflow: hidden;">
      <span style="margin-left: 5px; margin-right: 5px; ${subtitlePosition}; opacity: ${editorSettings.focus ? "30" : '50'}%; width: 100%; height: 24px;">${Action.subtitle.replaceAll("", "​")}</span>
      </div>
      <div style="flex-grow: 1; opacity: 0; display: ${rightSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>

      <div class="deleteActionButton ${editorSettings.focus ? "noShow" : ''} flexbox" onclick="deleteAction('${at}', ${index})" style="margin-left: 5px;"><div class="image trash"></div></div>
      </div>
    `
  });

  document.getElementById(at).innerHTML = endHTML;
  highlights[at].selected = []
}

function highlightAction(container, index) {
  lastContainer = container;
  let selected = [];
  if (highlights[container].selected) {
    selected = highlights[container].selected;
  }
  if (!isHoldingCTRL && selected.length != 0) {
    highlights[container].selected = [];
    selected = [];
    refreshActions(container);
  }

  let newAction = document.getElementById(`${container}Action${index}`)

  try {
    if (!isHoldingCTRL) {
      let oldAction = document.getElementById(`${container}Action${highlights[container].highlighted}`)
      oldAction.style.background = ''
    } else {
      if (selected.includes(index)) {
        selected.splice(selected.indexOf(index), 1)
        newAction.style.background = ''
        return;
      } else {
        if (selected.length == 0) {
          if (highlights[container].highlighted != index) {
            selected.push(highlights[container].highlighted);
          }
        }
        selected.push(index)
      }
    }
  } catch (e) { }

  highlights[container] = { highlighted: index, type: 1, selected };

  newAction.style.background = `var(--accent)`
}

function deleteAction(at, number) {
  action.data[at].splice(number, 1);
  refreshActions(at);
}
var actionParent;
var draggedAction;
var draggedOverAction;
function handleActionDrag(at, actionNumber) {
  draggedAction = actionNumber;
  actionParent = at;
  timing = new Date().getTime();
}
function actionDragOverHandle(event, at, actionNumber) {
  if (at != actionParent) return;
  event.preventDefault();
  draggedOverAction = actionNumber;
}

function handleActionDragEnd() { }

function moveArrayElement(arr, old_index, new_index) {
  const element = arr[old_index];
  arr.splice(old_index, 1);
  arr.splice(new_index, 0, element);

  return arr;
}
function handleActionDrop(at) {
  if (new Date().getTime() - timing < 100) return;

  let oldPosition = parseFloat(draggedAction);
  let newPosition = parseFloat(draggedOverAction);
  lastType = 1;

  let modifiedActions = moveArrayElement(
    action.data[at],
    oldPosition,
    newPosition,
  );

  action.data[at] = modifiedActions;
  refreshActions(at);
}