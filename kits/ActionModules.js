function newObject(type) {
  createCheckpoint({
    recacheFolders: true
  });
  if (type == 1) {
    let additionalData = {
      channel: {
        type: 'id',
        value: ''
      }
    };

    let highlightedGroupType = 'event'
    if (botData.commands[lastObj].type == 'action') {
      highlightedGroupType = botData.commands[lastObj].trigger
    }

    if (highlightedGroupType == 'slashCommand') {
      additionalData = {
        channel: {
          type: "commandInteraction",
          value: ""
        }
      }
    } else if (highlightedGroupType != 'event') {
    }
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
        replyToInteraction: true,
        storeAs: {
          value: "",
          type: "temporary"
        }
      },
      id: customIDsCalculated + new Date().getTime()
    };

    botData.commands[lastObj].actions.splice(((lastAct != undefined) ? Number(lastAct) : 0) + 1, 0, newAct)
    botData.commands[lastObj].actions.filter(
      (e) => e != undefined || e != null,
    );
    lastAct = botData.commands[lastObj].actions.length;
    saveLocally();
    refreshActions(true);
    document.getElementById(`${lastObj}Groupcount`).innerHTML = lastAct;

    if (editorSettings.editActionsOnCreation) {
      highlight(document.getElementById(`Action${botData.commands[lastObj].actions.length - 1}`)).then(() => {
        editAction({ picker: true });
      })
    }
  } else {
    let type = "action";
    let trigger;
    let extra = {};
    if (selectedGroupType == "command") {
      trigger = "textCommand";
      switch (settings.defaultCommandType) {
        case 'Slash':
          trigger = 'slashCommand';
          break

        case 'Message':
          trigger = 'messageContent'
          break

        case 'Message Command':
          trigger = 'message'
          break

        case 'User Command':
          trigger = 'user'
          break
      }
      extra = { boundary: { worksIn: "guild", limits: [] }, parameters: [], description: "No Description" };
    }
    if (selectedGroupType == "event") {
      extra = { eventFile: "message_create.js", eventData: ["", ""] };

      type = "event";
      trigger = "event";
    }

    let newGroup = {
      name: "",
      type: type,
      trigger,
      actions: [],
      customId: new Date().getTime(),
      ...extra,
      folder: [lastFolder]
    };

    // if (lastFolder && !cachedFolders[lastFolder].closed) {
    //   botData.commands.splice(cachedFolders[lastFolder].last + 1, 0, newGroup);
    // } else {
    //   botData.commands.splice(Number(lastObj || cachedFolders[lastFolder]?.last || botData.commands.length) + 1, 0, newGroup);
    //   newGroup.folder = null;
    // }
    botData.commands.push(newGroup)

    const folderUsed = lastFolder;

    lastObj = botData.commands.length;
    saveLocally();
    recacheFolders();
    refreshGroups(true);


    setTimeout(async () => {
      await highlight(document.getElementById(`Group${folderUsed ? cachedFolders[folderUsed].last : botData.commands.length - 1}`));
    }, 10);
  }
  checkSaveStatus()
}

async function deleteFolder(folderID) {
  let keepGoing = false;
  if (editorSettings.commandDeletionScreening) {
    try {
      keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: getString(strings.editor.folder_deletion_confirmation, [cachedFolders[lastFolder].name]) }, 'deletionModalInteraction');
      if (!keepGoing) return;
    } catch (error) {
      keepGoing = true;
    }
  }

  createCheckpoint({ recacheFolders: true });
  delete botData.folders[folderID];

  await recacheFolders(); await refreshGroups();

  setTimeout(() => {
    highlight(document.getElementById('Group0'));
  }, 100);
}

function duplicateGroup(index) {
  createCheckpoint();
  botData.commands.splice(parseFloat(index) + 1, 0, JSON.parse(JSON.stringify(botData.commands[index])))

  botData.commands[parseFloat(index) + 1].customId = new Date().getTime()
  saveLocally();

  recacheFolders();
  refreshGroups();
}

async function deleteCommand(index) {
  if (editorSettings.commandDeletionScreening) {
    let keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: getString(botData.commands[index].type == 'action' ? strings.editor.command_deletion_confirmation : strings.editor.event_deletion_confirmation, [botData.commands[index].name]) }, 'deletionModalInteraction');
    if (!keepGoing) return;
  }
  await new Promise(res => {
    document.getElementById(`Group${index}`).style.transition = `all 0.${editorSettings.fastAnimation}s ease`

    document.getElementById(`Group${index}`).style.opacity = '0'
    document.getElementById(`Group${index}`).style.height = '0'
    document.getElementById(`Group${index}`).style.paddingTop = '0'
    document.getElementById(`Group${index}`).style.paddingBottom = '0'
    document.getElementById(`Group${index}`).style.marginTop = '0'
    document.getElementById(`Group${index}`).style.marginBottom = '0'

    setTimeout(() => {
      res()
    }, editorSettings.fastAnimation * 100);
  })

  try {
    createCheckpoint();
    botData.commands.splice(index, 1);
    saveLocally();
    recacheFolders();
    refreshGroups();
  } catch (err) { console.error(err) }

  if (selectedGroupType == 'slash') {
    setHighlightedGroup(2)
  } else if (selectedGroupType == 'text') {
    setHighlightedGroup(1)
  } else if (selectedGroupType == 'event') {
    setHighlightedGroup(3)
  }
  document.getElementById('actionbar').innerHTML = ''

  refreshGroups();
}

async function deleteAction(index) {
  if (editorSettings.actionDeletionScreening) {
    let keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: `Are you sure you want to delete ${botData.commands[lastObj].actions[index].name}?` }, 'deletionModalInteraction');
    if (!keepGoing) return;
  }


  await new Promise(res => {
    document.getElementById(`Action${index}`).style.transition = `all 0.${editorSettings.fastAnimation}s ease`

    document.getElementById(`Action${index}`).style.opacity = '0'
    document.getElementById(`Action${index}`).style.height = '0'
    document.getElementById(`Action${index}`).style.paddingTop = '0'
    document.getElementById(`Action${index}`).style.paddingBottom = '0'
    document.getElementById(`Action${index}`).style.marginTop = '0'
    document.getElementById(`Action${index}`).style.marginBottom = '0'

    setTimeout(() => {
      res()
    }, editorSettings.fastAnimation * 100);
  })
  createCheckpoint()
  let deserializedAction = botData.commands[lastObj].actions[index];
  botData.commands[lastObj].actions.splice(index, 1);
  saveLocally();
  refreshActions();
  document.getElementById(`${lastObj}Groupcount`).innerHTML = botData.commands[lastObj].actions.length;
}

let timing;

var draggedGroup;
var draggedOverGroup;
var draggedOverFolder;
var lastDraggedOverFolder;
var stillOverFolder = {}
var stillOver = false;
var lastDraggedOverThing;
var draggedFolder;

function handleFolderDragStart(folder) {
  timing = new Date().getTime();
  draggedFolder = folder;
}

function handleFolderDragEnd() {
  if (new Date().getTime() - timing < 100) return;
  createCheckpoint({ recacheFolders: true });
  let folder = cachedFolders[draggedFolder];

  let transferredGroups = 0;

  let newPosition = parseFloat(draggedOverGroup);
  let toTransfer;

  if (folder.last == folder.first) {
    toTransfer = 1;
  } else {
    toTransfer = Number(folder.last + 1) - folder.first
  }

  let folderArray = [draggedFolder];

  if (draggedOverFolder) {
    folderArray = [draggedOverFolder, ...folderArray];
  }

  while (transferredGroups < toTransfer) {
    botData.commands[folder.first].folder = folderArray;
    transferredGroups++

    botData.commands = moveArrayElement(botData.commands, folder.first, newPosition);

    if (newPosition < folder.first) {
      newPosition++
      folder.first = folder.first + 1;
    }
  }

  recacheFolders();
  saveLocally();

  refreshGroups();

  draggedFolder = undefined;
}

function handleGroupDrag(group) {
  timing = new Date().getTime();
  draggedGroup = group.id.split("Group")[1];
}
function groupDragOverHandle(event, group) {
  group.classList.add("goofyhovereffectlite");
  /*
    placeholderGroup = document.createElement('div')
    placeholderGroup.style.animationName = 'fade'
    placeholderGroup.style.marginTop = '41px'
    placeholderGroup.style.marginBottom = '-35px'
    */

  event.preventDefault();
  draggedOverGroup = group.id.split("Group")[1];
  group.style.animationName = "";
  group.style.animationDuration = "";
  group.style.animationDelay = "";
  lastDraggedOverThing = 1;
}

function handleGroupDragEnd(group) {
  group.classList.remove("goofyhovereffectlite");
}

function handleGroupDrop(group) {
  createCheckpoint({ recacheFolders: true });
  refreshGroups();
  if (new Date().getTime() - timing < 100) return;
  let oldPosition = parseFloat(draggedGroup);
  let newPosition = parseFloat(draggedOverGroup);
  let newFolder = null;

  if (draggedOverGroup && draggedOverFolder) {
    botData.commands[oldPosition].folder = botData.commands[newPosition].folder;
  } else {
    botData.commands[oldPosition].folder = null;
  }

  lastObj = newPosition;
  botData.commands = moveArrayElement(
    botData.commands,
    oldPosition,
    newPosition,
  );

  saveLocally();
  recacheFolders();
  refreshGroups();
  checkSaveStatus();

  draggedOverFolder = undefined;
  lastDraggedOverFolder = undefined;
  stillOver = false;
}

var draggedAction;
var draggedOverAction;
function handleActionDrag(action) {
  timing = new Date().getTime();
  draggedAction = action.id.split("Action")[1];
}
function actionDragOverHandle(event, action) {
  action.classList.add("flash");
  action.style.animationName = "";
  action.style.animationDuration = "";
  action.style.animationDuration = '0.6s';
  action.style.animationDelay = "";
  event.preventDefault();
  draggedOverAction = action.id.split("Action")[1];
}
function handleActionDragEnd(action) {
  action.classList.remove("flash");
}
function moveArrayElement(arr, old_index, new_index) {
  const element = arr[old_index];
  arr.splice(old_index, 1);
  arr.splice(new_index, 0, element);

  return arr;
}
function handleActionDrop(action) {
  refreshActions();
  createCheckpoint();
  if (new Date().getTime() - timing < 100) return;

  let oldPosition = parseFloat(draggedAction);
  let newPosition = parseFloat(draggedOverAction);
  lastType = 1;

  botData.commands[lastObj].actions = moveArrayElement(
    botData.commands[lastObj].actions,
    oldPosition,
    newPosition,
  );
  saveLocally();
  refreshActions();
  checkSaveStatus()
}

refreshGroups()

function setHighlightedGroup(type) {
  let oldGroupType;
  let trigger = 'action'
  if (selectedGroupType == "command") {
    oldGroupType = 1;
  }
  if (selectedGroupType == "event") {
    oldGroupType = 3;
  }

  if (type == 1 || type == 2) {
    selectedGroupType = "command";
    prioritizeCommandOptions();
    document.getElementById('types-EVENTS').style.background = ''
    document.getElementById('types-COMMANDS').style.background = 'var(--accent)'
  }

  if (type == 3) {
    trigger = 'event'
    prioritizeEvents();
    selectedGroupType = "event";
    document.getElementById('types-COMMANDS').style.background = ''
    document.getElementById('types-EVENTS').style.background = 'var(--accent)'
  }

  refreshGroups();
}

if (!Array.isArray(botData.commands)) {
  transferProject();

  location.reload();
}
function transferProject() {
  botData.commands = Object.values(botData.commands);
  saveLocally();
  for (let command in botData.commands) {
    botData.commands[command].actions = Object.values(
      botData.commands[command].actions,
    );
    console.log(botData.commands[command].actions);
    saveLocally();
    for (let action of botData.commands[command].actions) {
      try {
        let actionBase = require(`${processPath}/AppData/Actions/${action.file}`);
        for (let UIelement in actionBase.UI) {
          if (UIelement.startsWith("actions")) {
            action.data[actionBase.UI[UIelement]] = Object.values(
              action.data[actionBase.UI[UIelement]],
            );
            saveLocally();
          }
        }
      } catch (err) { }
    }
  }
}

function storeCaretPosition(element) {
  let selection = window.getSelection();
  if (selection.rangeCount > 0) {
    let range = selection.getRangeAt(0);
    let preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(element);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    let caretOffset = preSelectionRange.toString().length;

    element.dataset.caretOffset = caretOffset;
  }
}

function restoreCaretPosition(element) {
  let caretOffset = parseInt(element.dataset.caretOffset) || 0;
  let textNode = element.firstChild;

  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    let range = document.createRange();
    range.setStart(textNode, Math.min(caretOffset, textNode.length));
    range.setEnd(textNode, Math.min(caretOffset, textNode.length));

    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function validateInputSpaces(div) {
  storeCaretPosition(div);

  var sanitizedText = div.innerText.replaceAll('\n', '')

  sanitizedText = sanitizedText.substr(0, 32);

  div.innerHTML = sanitizedText;
  restoreCaretPosition(div);
}

let isTypeManagerOpen = false;
function dropTypes() {
  if (isTypeManagerOpen) {
    return
  }
  var element = document.getElementById('edutor');
  element.scrollTop = element.scrollHeight;

  isTypeManagerOpen = true;
  let typeManager = document.getElementById('typeOfGroup');
  // typeManager.classList.remove('hoverable')
  let types = {
    messageContent: "Message Content",
    textCommand: "Text Command",
    slashCommand: "Slash Command",
    message: "Message Command",
    user: "User Command"
  }
  let commandType = botData.commands[lastObj].trigger
  typeManager.onclick = () => {
    isTypeManagerOpen = false;

    typeManager.onclick = () => {
      dropTypes();
    }

    const innerHeight = typeManager.clientHeight;
    typeManager.style.animationDuration = "";
    typeManager.style.setProperty("--inner-height", innerHeight + "px");
    typeManager.style.animationName = "shrink";
    typeManager.style.animationDuration = "200ms";
    setTimeout(() => {
      typeManager.innerHTML = `${types[botData.commands[lastObj].trigger]}`
      // typeManager.classList.add('hoverable')
      setTimeout(() => {
        typeManager.style.animationName = 'unset'
        typeManager.style.height = ''

        highlight(document.getElementById(`Group${lastObj}`))
        saveLocally();
      }, 80);
    }, 100);
  }

  for (let type in types) {
    if (type != commandType) {
      typeManager.innerHTML += `
      <div class="dropdown_option" onclick="createCheckpoint(); botData.commands[lastObj].trigger = '${type}'; saveLocally(); setTimeout(() => {refreshGroups();}, editorSettings.commonAnimation * 100)">${types[type]}</div>
      `
    }
  }
}

function declareAsRunningInFolder(event) {
  if (!lastFolder) return;
  event.preventDefault()
  document.getElementById('actionbar').firstElementChild.style.opacity = '0';
  document.getElementById('actionbar').firstElementChild.style.scale = '0.5';
  document.getElementById('actionbar').firstElementChild.style.filter = 'blur(12px)';
  document.getElementById('actionbar').firstElementChild.style.transition = `all var(--commonAnimation) var(--ease-strong)`
  setTimeout(() => {
    document.getElementById('actionbar').firstElementChild.style.display = 'none'
    let element = document.createElement('btext');
    element.style.opacity = '0';
    element.style.margin = 'auto';
    element.style.scale = '1.2';
    element.style.filter = 'blur(12px)';
    element.style.transition = `all var(--commonAnimation) var(--ease-strong)`
    element.innerHTML = getString(strings.editor.release_to_add_to_folder, [cachedFolders[lastFolder].name]);
    document.getElementById('actionbar').appendChild(element);

    draggedOverFolder = lastFolder;
    draggedOverGroup = cachedFolders[lastFolder].last + 1;

    setTimeout(() => {
      element.style.scale = '1';
      element.style.opacity = '1';
      element.style.filter = 'blur(0px)';
    }, editorSettings.fastAnimation * 30);
  }, editorSettings.commonAnimation * 100);
}

function declareAsNotRunningInFolder(event) {
  if (!lastFolder) return;
  event.preventDefault();
  document.getElementById('actionbar').firstElementChild.nextElementSibling.style.scale = '1.2';
  document.getElementById('actionbar').firstElementChild.nextElementSibling.style.opacity = '0';
  document.getElementById('actionbar').firstElementChild.nextElementSibling.style.filter = 'blur(12px)';

  setTimeout(() => {
  document.getElementById('actionbar').firstElementChild.style.display = '';
    setTimeout(() => {
      document.getElementById('actionbar').firstElementChild.nextElementSibling.remove();
      document.getElementById('actionbar').firstElementChild.style.opacity = ''
      document.getElementById('actionbar').firstElementChild.style.scale = '';
      document.getElementById('actionbar').firstElementChild.style.filter = '';  
    }, editorSettings.fastAnimation * 30);
  }, editorSettings.commonAnimation * 100);

  draggedOverFolder = undefined;
}