let areSettingsOpen;
let preventClose;
function array_move(arr, old_index, new_index) {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
}

let settings;
try {
  settings = JSON.parse(
    fs.readFileSync(path + "/EditorSettings.json", "utf8"),
  );
} catch (err) { }

if (!settings) {
  fs.writeFileSync(path + "/EditorSettings.json", "{}");
  settings = JSON.parse(
    fs.readFileSync(path + "/EditorSettings.json", "utf8"),
  );
}

function saveLocally() {
  fs.writeFileSync(
    "./AppData/data.json",
    JSON.stringify(botData, null, 2),
  );
}

let lastRow;
let lastDraggedComponent;

window.oncontextmenu = function (event) {
  showCustomMenu(event.clientX, event.clientY);
  return false;
};

function copyAction(id) {
  if (selectedActions.length == 0) {
    ipcRenderer.send('copiedAction', botData.commands[lastObj].actions[id])
  } else {
    ipcRenderer.send('copiedAction', selectedActions.map(action => botData.commands[lastObj].actions[action]))
  }
}

function toHex(rgb) {
  try {
    let parts = rgb.replace('rgb(', '').replace(')', '').split(',');

    // Convert each part to an integer, then to a hex string and pad with zeros if necessary
    let r = parseInt(parts[0]).toString(16).padStart(2, '0');
    let g = parseInt(parts[1]).toString(16).padStart(2, '0');
    let b = parseInt(parts[2]).toString(16).padStart(2, '0');
  
    // Concatenate the hex strings and prepend with '#'
    return `${r}${g}${b}`;
  } catch (error) {
    return `#000000`
  }
}




/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {HTMLDivElement} target 
 */
function showCustomMenu(x, y, target) {
  if (!menu) {
    menu = document.createElement("div");
    document.body.appendChild(menu);
    menu.className = 'right_click_menu'
    menu.id = "customMenu";
  }


  // Calculate the maximum allowed coordinates based on window dimensions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const maxX = windowWidth - menuWidth;
  const maxY = windowHeight - menuHeight;

  let adjustedX = x;
  let adjustedY = y;
  if (x > maxX) {
    adjustedX = maxX;
  }
  if (y > maxY) {
    adjustedY = maxY - 48;
  }

  menu.style.top = adjustedY + "px";
  menu.style.left = adjustedX + "px";
  menu.style.width = "";

  menu.style.position = 'relative';
  menu.style.zIndex = '5000'
  menu.style.scale = 1;
  menu.style.opacity = 1;
  menu.innerHTML = ``;
  if (lastHovered) {
    if (lastHovered.id.startsWith("Group")) {
      menu.innerHTML += `
      <div class="dimension hoverablez contextMenuOption" onclick="duplicateGroup('${lastHovered.id.split('Group')[1]}')"><btext>Duplicate</btext></div>
      <div class="dimension hoverablez contextMenuOption" onclick="editRawData('${lastHovered.id.split('Group')[1]}')"><btext>Edit Data</btext></div>      
      <flexbox>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="deleteCommand('${lastHovered.id.split('Group')[1]}')" ><btext>Delete</btext></div>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="navigator.clipboard.writeText('${botData.commands[lastHovered.id.split('Group')[1]].customId}');" ><btext>Copy ID</btext></div>
      </flexbox>
      <div class="dimension hoverablez contextMenuOption" onclick="uploadToWorkshop('${lastHovered.id.split('Group')[1]}', 0)"><btext>${strings.editor.upload_workshop}</btext></div>
      <flexbox>
      <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="botData.commands[${lastHovered.id.split('Group')[1]}].color = null; saveLocally(); refreshGroups();"><btext>${strings.editor.reset_command_color}</btext></div>
      <div class="dimension hoverablez contextMenuOption halfMenuOption fullPadding" onclick="preventClose = true; setTimeout(() => {preventClose = null}, 100)"><input style="height: 100%; width: 100%;" type="color" value="#${toHex(botData.commands[lastHovered.id.split('Group')[1]].color)}" onchange="botData.commands[${lastHovered.id.split('Group')[1]}].color = hexToRGB(this.value); client.acheivements.activate('RAINBOWS'); saveLocally(); setTimeout(() => {refreshGroups();}, 100);"></input></div>
      </flexbox>
      `;
    }

    if (lastHovered.id.startsWith("Action")) {
      ipcRenderer.send('getCopiedAction');
      ipcRenderer.once('copiedAction', (e, action) => {
        menu.innerHTML += `
      <div class="dimension hoverablez contextMenuOption" onclick="copyAction(${lastHovered.id.split("Action")[1]})" ><btext>Copy</btext></div>
      `
        if (action) {
          menu.innerHTML += `<div class="dimension hoverablez contextMenuOption" onclick="pasteActionTo(${lastHovered.id.split("Action")[1]
            })" ><btext>Paste</btext>
        <btext style="opacity: 0.5;">${Array.isArray(action) ? (`${action.length} Action${action.length != 1 ? "s" : ""}`) : (action.name)}</btext>
        </div>`
        };
        menu.innerHTML += `
      <flexbox>
      <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="deleteAction(${lastHovered.id.split("Action")[1]})" ><btext>Delete</btext></div>
      <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="navigator.clipboard.writeText('${botData.commands[lastObj].actions[lastHovered.id.split('Action')[1]].id}');" ><btext>Copy ID</btext></div>
      </flexbox>`;
      })

    }
    if (lastHovered.id == 'folder') {
      let folderID = lastHovered.specifically;
      menu.innerHTML += `
        <div class="dimension hoverablez contextMenuOption" onclick="toggleFolderVisibility('${folderID}', document.getElementById('${folderID}').firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling);" ><btext>${closedFolders[folderID] ? "Open" : "Close"}</btext></div>
        <flexbox>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="deleteFolder(${folderID})" ><btext>Delete</btext></div>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="navigator.clipboard.writeText('${folderID}');" ><btext>Copy ID</btext></div>
        </flexbox>
        `;
    }
  }
}
function getCaretPosition(element) {
  var caretPos = 0;
  var sel;
  var range;
  var clonedRange;

  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      clonedRange = range.cloneRange();
      clonedRange.selectNodeContents(element);
      clonedRange.setEnd(range.endContainer, range.endOffset);
      caretPos = clonedRange.toString().length;
    }
  } else if (document.selection && document.selection.type !== "Control") {
    range = document.selection.createRange();
    clonedRange = range.duplicate();
    clonedRange.moveToElementText(element);
    clonedRange.setEndPoint("EndToEnd", range);
    caretPos = clonedRange.text.length;
  }

  return caretPos;
}

function setCaretPosition(element, caretPos) {
  let range;
  let offset = caretPos;
  let found = false;

  if (document.createRange) {
    range = document.createRange();
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (offset <= node.textContent.length) {
          range.setStart(node, offset);
          found = true;
          break;
        } else {
          offset -= node.textContent.length;
        }
      }
    }

    if (!found) {
      range.setStart(element, element.childNodes.length);
    }

    range.collapse(true);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (document.selection) {
    range = document.body.createTextRange();
    range.moveToElementText(element);
    range.moveStart("character", caretPos);
    range.collapse(true);
    range.select();
  }
}

function editRawData(group) {
  if (areSettingsOpen) return
  document.getElementById('titlebar1').style.transition = `all 0.${editorSettings.fastAnimation}s ease`

  areSettingsOpen = true;
  menu.remove();

  setTimeout(() => {
    document.getElementById('titlebar1').style.marginTop = '-37px'
  }, 100);
  document.body.innerHTML += `
  <div class="flexbox fade" style="z-index: 4000; position: relative; margin-left: auto; margin-right: auto; width: 100vw; height: 100vh; backdrop-filter: blur(32px); margin-top: 0; border-radius: var(--round-off); background: var(--dark-main);">
    <textarea contenteditable="true" id="rawdata" class="noanims borderbottomz" style="font-family: Consolas, 'Courier New', monospace; height: 100vh; margin: 0px !important; border-radius: var(--round-off) !important; width: calc(100% - 400px); background: var(--transparent-main);">
    ${JSON.stringify(botData.commands[group], null, 2).trim()}
    </textarea>
    <div style="width: 400px; margin-right: auto; height: 100vh;" class="flexbox">
    <div class="dimension editioned" style="display: ${isDismissed('new_rawdata') ? "none" : "block"}; width: calc(100% - 20px); margin-top: 5px; margin-left: auto; margin-right: auto; border-radius: var(--round-normal); padding: 5px; padding-left: 6px; padding-right: 6px; background: var(--secondary-main); height: 51.5px; opacity: 0.8; transition: all 0.${editorSettings.commonAnimation}s ease !important">
    <div class="flexbox">
    <div class="buttontexta textToLeft" style="font-size: 23px !important; margin-left: 10px !important;">${strings.dismissible_content.rawdata_editor_new}</div>
    <btn onclick="dismissContent('new_rawdata'); this.parentElement.parentElement.style.height = '0px'; this.parentElement.parentElement.style.padding = '0px'; this.parentElement.parentElement.style.marginTop = '0'; this.parentElement.parentElement.style.opacity = '0'" style="width: 70px; border-radius: var(--round-mild); margin-right: -2px;" class="flexbox"><btext style="display: block;">Dismiss</btext></btn>
    </div>
    <div class="buttontexta textToLeft" style="margin-left: 10px !important; opacity: 50%;">${strings.dismissible_content.rawdata_editor_new_subtitle}</div>
    </div>
    <div style="margin-bottom: auto; height: calc(100% - 160px); margin-top: auto; display: block; width: 100%; border-radius: var(--round-intense); overflow: auto;">
    <br>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.folder_id, [botData.commands[group].folder || "null"]?.join(', ') || "")}</btext>
    <btn style="display: inline;" onclick="clipboardCopy('${botData.commands[group].folder || "null"}')">
      <btext>${strings.misc.copy}</btext>
    </btn>
    <div style="margin-top: 10px"></div>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.id, [botData.commands[group].customId])}</btext>
    <btn style="display: inline;" onclick="clipboardCopy('${botData.commands[group].customId || "null"}')">
      <btext>${strings.misc.copy}</btext>
    </btn>
    <div class="sepbars" style="width: calc(100% - 40px);"></div>
    <div style="margin-top: 10px"></div>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.description, [botData.commands[group].description])}</btext>
    <div style="margin-top: 10px"></div>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.permissions, [botData.commands[group].boundary?.limits || "Unset"])}</btext>
    <div style="margin-top: 10px"></div>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.nsfw, [botData.commands[group].boundary?.nsfw || "false"])}</btext>
    <div style="margin-top: 10px"></div>
    <btext style="margin-left: 20px; display: inline-block;">${getString(strings.editor.rawdata_editor.installable, [botData.commands[group].boundary?.installable || "false"])}</btext>

    </div>
    <div style="margin-bottom: 0px; margin-top: auto; width: 100%;">
    <div class="buttonshift" style="width: calc(100% - 20px); margin-left: auto; margin-right: auto; margin-top: auto; margin-bottom: 0px;" onclick="location.reload(); this.parentElement.parentElement.remove();"><btext>${strings.misc.exit}</btext></div>
    <div class="flexbox" style="margin-top: 0px; width: 100%; margin-bottom: 2.5px; height: 40px;">
    <div class="buttonshift rounded_right" style="margin-right: 0px; margin-top:0px; margin-bottom:0px; width: calc(50% - 20px); margin-left: auto;" onclick="highlight(document.getElementById('Group1')); botData.commands[${group}] = JSON.parse(document.getElementById('rawdata').value); saveLocally(); refreshGroups(); location.reload();"><btext>${strings.editor.rawdata_editor.serialized_upload}</btext></div>
    <div class="buttonshift rounded_left" style="margin-right: auto; margin-top:0px; margin-bottom:0px; width: calc(50% - 20px); margin-left: 5px;" onclick="highlight(document.getElementById('Group1')); botData.commands[${group}] = JSON.parse(document.getElementById('rawdata').value); botData.commands[${group}].customId = new Date().getTime(); saveLocally(); refreshGroups(); location.reload();"><btext>${strings.editor.rawdata_editor.deserialized_upload}</btext></div>
    </div>
    </div>
    </div>
    </div>
  `
}

function pasteActionTo(index) {
  ipcRenderer.send('getCopiedAction')

  ipcRenderer.once('copiedAction', (e, action) => {
    if (action) {
      createCheckpoint();
      if (Array.isArray(action)) {
        let pasteIndex = Number(index) + 1;
        action.forEach(act => {
          botData.commands[lastObj].actions.splice(pasteIndex, 0, act);
          pasteIndex++
        });
        saveLocally();
        refreshActions();
      } else {
        botData.commands[lastObj].actions.push(action);
        botData.commands[lastObj].actions = moveArrayElement(
          botData.commands[lastObj].actions,
          botData.commands[lastObj].actions.length - 1,
          parseFloat(index) + 1,
        );
        saveLocally();
        refreshActions();
      }
    }
  })

}

window.oncontextmenu = function (event) {
  showCustomMenu(event.clientX, event.clientY, event.target);
  return false;
};

window.addEventListener("click", function (event) {
  if (menu && !preventClose) {
    menu.style.scale = "var(--menu-initial-scale)";
    menu.style.opacity = "var(--menu-initial-opacity)";
    setTimeout(() => {
      menu.remove();
      menu = null;
    }, editorSettings.commonAnimation * 100);
  }
});

function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}

async function handleKeybind(keyEvent) {
  if (keyEvent.key == 'Enter' && searchBar) {
    document.getElementById('searchResults').firstElementChild.nextElementSibling.onclick()
  }
  if (keyEvent.key.toLowerCase() == keybinds.search.key && keyEvent[keybinds.modifier] == true && keyEvent.repeat == false) {
    toggleSearch()
  }

  if (Number(keyEvent.key) != NaN && keyEvent[keybinds.modifier]) {
    if (lastHighlightedType == 1) {
      if (isHoldingCTRL && !keyEvent.shiftKey) {
        isHoldingCTRL = false;
        await highlight(document.getElementById(`Action${keyEvent.key - 1}`));
        isHoldingCTRL = true;
      }
    }
  }

  if (keyEvent.key.toLowerCase() == keybinds.save.key && keyEvent[keybinds.modifier] == true) {
    saveLocally();
    savePrj();
  }

  if (keyEvent.key.toLowerCase() == keybinds.newAction.key && keyEvent[keybinds.modifier] == true) {
    newObject(1)
  }

  if (keyEvent.key.toLowerCase() == keybinds.newCommand.key && keyEvent[keybinds.modifier] == true) {
    newObject(0)
  }



  if (keyEvent.key == 'Escape') {
    if (searchBar) {
      toggleSearch();
    }
  }

  if (document.activeElement.tagName != "BODY") return;

  if (keyEvent.key.toLowerCase() == "d" && keyEvent[keybinds.modifier] == true) {
    duplicateGroup(lastObj)
    return
  }

  if (keyEvent.key == 'ArrowUp') {
    if (lastHighlightedType == 1) {
      highlight(document.getElementById(`Action${Number(lastAct) - 1}`));
    }
    if (lastHighlightedType == 0) {
      await highlight(document.getElementById(`Group${Number(lastObj) - 1}`));
      if (botData.folders[botData.commands[lastObj].folder].closed) {
        toggleFolderVisibility(botData.commands[lastObj].folder, document.getElementById(`${botData.commands[lastObj].folder}closebutton`))
        saveLocally();
        recacheFolders();
      }
    }
  }

  if (keyEvent.key.toLowerCase() == 'a' && keyEvent[keybinds.modifier] && document.activeElement.tagName == 'BODY') {
    if (lastHighlightedType == 1) {
      selectedActions = [];

      highlight(document.getElementById(`Action0`));
      botData.commands[lastObj].actions.forEach((act, index) => {
        if (index != 0) {
          highlight(document.getElementById(`Action${index}`))
        }
      });
      selectedActions.sort((a, b) => a - b)
    }
  }

  let symbolsToNumbers = {
    "!": "1",
    "@": "2",
    "#": "3",
    "$": "4",
    "%": "5",
    "^": "6",
    "&": "7",
    "*": "8",
    "(": "9",
    ")": "10"
  };

  if (keyEvent.shiftKey && symbolsToNumbers[keyEvent.key] && !keyEvent[keybinds.modifier]) {
    isHoldingCTRL = true;
    await highlight(document.getElementById(`Action${Number(symbolsToNumbers[keyEvent.key]) - 1}`));
    isHoldingCTRL = false;
  }

  if (keyEvent.key == 'ArrowDown') {
    if (lastHighlightedType == 1) {
      highlight(document.getElementById(`Action${Number(lastAct) + 1}`));
    }
    if (lastHighlightedType == 0) {
      await highlight(document.getElementById(`Group${Number(lastObj) + 1}`));
      if (botData.folders[botData.commands[lastObj].folder].closed) {
        toggleFolderVisibility(botData.commands[lastObj].folder, document.getElementById(`${botData.commands[lastObj].folder}closebutton`))
        saveLocally();
        recacheFolders();
      }
    }
  }

  if (keyEvent.key == 'Enter') {
    createCheckpoint({ recacheFolders: true });

    if (lastHighlightedType == 1) {
      highlight(document.getElementById(`Action${lastAct}`));
      editAction(lastAct);
    }
    if (lastHighlightedType == 0) {
      lastHighlightedType = 1;
    }
    if (lastHighlightedType == 2) {
      toggleFolderVisibility(lastFolder, document.getElementById(`${lastFolder}closebutton`))
      saveLocally();
      recacheFolders();
    }
  }

  if (keyEvent.key.toLowerCase() == 'c' && keyEvent[keybinds.modifier] == true && !keyEvent.repeat) {
    if (lastHighlightedType == 0) {
      document.getElementById(`Group${lastObj}`).style.rotate = '-2deg'
      setTimeout(() => {
        document.getElementById(`Group${lastObj}`).style.rotate = '2deg'
        setTimeout(() => {
          document.getElementById(`Group${lastObj}`).style.rotate = '0deg'
        }, 100);
      }, 100);

      ipcRenderer.send('copiedAction', botData.commands[lastObj].actions);
      notify('Copied ' + botData.commands[lastObj].actions.length + ' Actions!')
    }

    if (lastHighlightedType == 1) {
      if (selectedActions.length != 0) {
        notify('Copied ' + selectedActions.length + ` Action${selectedActions.length == 1 ? "" : "s"}`);

        let toSend = [];

        selectedActions.forEach(action => {
          toSend.push(botData.commands[lastObj].actions[action])
        })

        ipcRenderer.send('copiedAction', toSend);
      } else {
        ipcRenderer.send('copiedAction', botData.commands[lastObj].actions[lastAct]);
      }
    }

    if (lastHighlightedType == 2) {
      document.getElementById(`${lastFolder}`).style.rotate = '-2deg'
      setTimeout(() => {
        document.getElementById(`${lastFolder}`).style.rotate = '2deg'
        setTimeout(() => {
          document.getElementById(`${lastFolder}`).style.rotate = ''
        }, 100);
      }, 100);

      let copiedActions = [];
      let totalActions = 0;

      let folder = cachedFolders[lastFolder];
      let commandsArray = [];

      botData.commands.forEach((value, index) => {
        if (index >= folder.first && index <= folder.last) {
          commandsArray.push(value)
        }
      });

      commandsArray.map(command => command.actions).forEach(actions => {
        actions.forEach(action => {
          copiedActions.push(action);
          totalActions++
        })
      });

      ipcRenderer.send('copiedAction', copiedActions);

      notify('Copied ' + copiedActions.length + ` Action${totalActions == 1 ? "" : "s"}`);
    }
  }

  if (keyEvent.key.toLowerCase() == 'v' && keyEvent[keybinds.modifier] == true && !keyEvent.repeat) {
    if (lastHighlightedType != 2) {
      let toInsertAt = lastAct;
      toInsertAt++
      ipcRenderer.send('getCopiedAction');

      ipcRenderer.once('copiedAction', (event, actions) => {
        createCheckpoint()
        if (Array.isArray(actions)) {
          actions.forEach(action => {
            botData.commands[lastObj].actions.splice(toInsertAt, 0, action);
            toInsertAt++
          })
        } else {
          botData.commands[lastObj].actions.splice(Number(lastAct) + 1, 0, actions)
        }
        refreshGroups();
        saveLocally();
      })
    }
  }

  if (keyEvent.key == 'Delete') {
    if (document.activeElement.tagName != 'BODY') return
    if (lastHighlightedType == 1 && (selectedActions.length != 0 || botData.commands[lastObj]?.actions[lastAct])) {
      createCheckpoint({ recacheFolders: false });

      if (selectedActions.length != 0) {
        if (editorSettings.actionDeletionScreening) {
          let keepGoing = await awaitIPCResponse({ channel: "deleteScreening", content: `Are you sure you want to delete ${selectedActions.length} actions?` }, 'deletionModalInteraction');
          if (!keepGoing) return;
        }

        let endActions = [];
        for (let action in botData.commands[lastObj].actions) {
          if (!selectedActions.includes(`${action}`)) {
            endActions.push(botData.commands[lastObj].actions[action])
          }
        }
        botData.commands[lastObj].actions = endActions;
      } else {
        deleteAction(lastAct);
      }
      refreshActions();
      saveLocally();
    }

    if (lastHighlightedType == 0) {
      createCheckpoint({ recacheFolders: true });
      deleteCommand(lastObj)
    }

    if (lastHighlightedType == 2) {
      createCheckpoint({ recacheFolders: true });
      deleteFolder(lastFolder)
    }
  }

  if (keyEvent.key.toLowerCase() == 'z' && keyEvent[keybinds.modifier] == true) {
    undo();
  }

  if (keyEvent.key.toLowerCase() == 'y' && keyEvent[keybinds.modifier] == true) {
    redo();
  }

  if (keyEvent.key.toLowerCase() == 'q' && keyEvent[keybinds.modifier] == true) {
    toggleBotStatus('shutdownBot');
  }

  if (keyEvent.key.toLowerCase() == keybinds.create.key && keyEvent[keybinds.modifier] == true) {
    newAction();
  }

  if (keyEvent.key.toLowerCase() == keybinds.toggle.key && keyEvent[keybinds.modifier] == true) {
    resizeCommands();
  }
}

let searchBar;

function fuzzyMatch(str, pattern, accuracy) {
  pattern = pattern.replace(/[-\\\/^$*+?.()|[\]{}]/g, "\\$&");
  pattern = pattern.split("").reduce((a, b) => a + `.*${b}`, "");

  const regex = new RegExp(pattern, "i");
  const matchScore = str.match(regex) ? str.match(regex)[0].length : 0;
  const requiredScore = str.length * accuracy;

  return matchScore >= requiredScore;
}

function toggleSearch(preview) {
  if (searchBar == undefined) {
    if (searchBar == undefined && areSettingsOpen) return;
    document.getElementById('searchIcon').style.rotate = '360deg'
    areSettingsOpen = true;
    searchBar = document.createElement('div');
    searchBar.className = 'search'
    searchBar.style.zIndex = '2147483647'
    searchBar.style.position = 'relative'

    document.body.appendChild(searchBar);
    searchBar.innerHTML = `
      <input oninput="search(this.value)" placeholder="ActionPallete Query..." style="width: calc(800px - 9px) !important; margin-top: 0px !important;">
      <div id="searchResults" style="overflow: auto; height: 0px; margin: 0px !important; transition: all var(--commonAnimation) var(--ease-strong);"></div>
      <text>Start your search with <span class="indicator">:</span> to search within ${botData.commands[lastObj]?.name || "nothing"}'s actions, <span class="indicator">!</span> to search for a(n) ${selectedGroupType} and <span class="indicator">/</span> to search through available automations.</text>
    `

    setTimeout(() => {
      searchBar.firstElementChild.focus();
      searchBar.style.opacity = '1';
      searchBar.style.scale = '1';
      searchBar.style.filter = 'unset'
    }, 30);
  } else {
    document.getElementById('searchIcon').style.rotate = '0deg'
    areSettingsOpen = false;
    searchBar.style.scale = ''
    searchBar.style.opacity = ''
    searchBar.style.filter = ''
    const cachedsearchbar = searchBar;
    searchBar = undefined;
    setTimeout(() => {
      cachedsearchbar.remove();
    }, editorSettings.commonAnimation * 100);
  }
}

if (botData.openThemesAtLaunch) {
  botData.openThemesAtLaunch = false;
  saveLocally();

  toggleSearch();

  let themes = [];

  fs.readdirSync('./Themes').forEach(themeFolder => {
    try {
      let themeData = require(`${processPath}/Themes/${themeFolder}/data.json`);
      themes.push({ ...themeData, folder: themeFolder })
    } catch (error) { }
  })

  searchBar.style.height = 'fit-content'
  searchBar.style.paddingBottom = '5px'
  searchBar.style.maxHeight = '500px'
  searchBar.innerHTML = `
  ${studioUI.dropdown({
    name: 'Theme',
    options: [{ name: "Default", value: "default" }, ...themes.map((theme) => { return { name: theme.name, value: theme.folder } })],
    currentChoice: settings.theme,
    onclick: "pickTheme(this.parentElement.dataset.chosen)",
    forcePush: true,
    style: "width: 98.5% !important;"
  })}

  <btn onclick="toggleSearch()" style="width: calc(98.5% - 14px); margin-top: 10px !important; margin: auto; display: block;"><btext>${strings.misc.done}</btext></btn>
  `
}

function pickTheme(theme) {
  settings.theme = theme;
  saveSettings();

  try {
    let themeCss = fs.readFileSync(`./Themes/${theme}/theme.css`, 'utf8');

    if (document.getElementById('theme_container')) {
      document.getElementById('theme_container').innerHTML = themeCss
    } else {
      let styleSheet = document.createElement('style');
      styleSheet.id = 'theme_container';
      styleSheet.innerHTML = themeCss;
      document.body.appendChild(styleSheet)
    }
    document.body.style.background = 'var(--editor-background)'
  } catch (error) {
    document.getElementById('theme_container').innerHTML = ''
    setColor({ style: { background: botData.color || "rgb(0, 0, 0)" } });
  }
}


try {
  pickTheme(settings.theme)
} catch (error) {
  pickTheme('default')
}

async function search(query) {
  await new Promise(res => {
    res()
    if (loadedAutomations.length == 0) {
      fs.readdirSync('./Automations').forEach((folderName) => {
        try {
          loadedAutomations.push({
            ...require(`${process.cwd()}/Automations/${folderName}/data.json`), ...{
              id: folderName
            }
          });
        } catch (error) { }
      })
    }
  })


  let results = document.getElementById('searchResults')
  results.innerHTML = ''
  if (query == '') {
    searchBar.style.marginTop = ''
    setTimeout(() => {
      results.style.height = '0px'
    }, 10);
    return
  } else {
    searchBar.style.marginTop = '2vh'
  }

  let queryTypes = {
    '/': "automations",
    '!': "commands",
    ':': "actions",
  }

  let queryType = [queryTypes[query[0]]];
  if (!queryType[0]) {
    queryType = ["actions", "automations", "commands"];
  } else {
    query = query.substring(1)
  }


  let actions = botData.commands[lastObj].actions;

  let resultsFound = 0;

  let endResults = {
    actions: [],
    automations: [],
    commands: []
  }

  queryType.forEach((type) => {
    if (type == 'actions') {
      actions.forEach((action, index) => {
        if (fuzzyMatch(action.name.toLowerCase().replaceAll(' ', ''), query.toLowerCase().replaceAll(' ', ''), 0.12) || Number(query.replaceAll('#', '')) - 1 == index) {
          endResults[type].push({
            indicator: `#${index + 1}`,
            label: action.name,
            actions: [
              { label: "Higlight", onclick: `highlight(document.getElementById('Action${index}'))` },
              { label: "Edit", onclick: `editAction(${index})` },
            ]
          })
        }
      });
    } else if (type == 'commands') {
      botData.commands.forEach((command, index) => {
        if (!((command.type == (selectedGroupType == "command" ? "action" : "event")) && command.name.replaceAll(' ', '') != '')) return;
        if (!editorSettings.hideCommandInvokers) {
          let commandTriggerMap = {
            textCommand: botData.prefix,
            slashCommand: "/",
          }

          preDeco = commandTriggerMap[command.trigger] || `<div class="image openExternally" style="width: 16px; height: 18px; margin: auto !important;"></div>`;
        }

        if (fuzzyMatch(command.name.toLowerCase().replaceAll(' ', ''), query.toLowerCase().replaceAll(' ', ''), 0.12)) {
          endResults[type].push({
            label: command.name,
            indicator: preDeco,
            actions: [
              { label: "Higlight", onclick: `highlight(document.getElementById('Group${index}'))` }
            ]
          })
        }
      })
    } else if (type == 'automations') {
      loadedAutomations.forEach((automation) => {
        if (fuzzyMatch(automation.name, query.toLowerCase().replaceAll(' ', ''), 0.12)) {
          endResults[type].push({
            label: automation.name,
            indicator: `<div class="image openExternally" style="width: 16px; height: 18px; margin: auto !important;"></div>`,
            onclick: 0,
            actions: [
              { label: "Run", onclick: `runAutomation('${automation.id}')` }
            ]
          })
        }
      })
    }
  })


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

  let toHTML = (data) => {
    return `
      <div class="action fade textToLeft flexbox dimension" onclick="${data.actions[data.onclick]?.onclick}">
        ${data.indicator ? `<text class="indicator">${data.indicator}</text>` : ""}
        <div style="margin-right: 5px;">${data.label}</div>

        <div style="flex-grow: 1; opacity: 0; display: ${leftSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>
        ${data.subtitle ? `<span style="opacity: 0.5">${data.subtitle}</span>` : ""}
        <div style="flex-grow: 1; opacity: 0; display: ${rightSeparatorDisplay}; height: 3px; border-radius: 10px; background-color: #ffffff15; margin: auto;"></div>
        ${data.actions?.map((i) => {
      return `
            <btn style="padding: 2px; margin-right: 5px;" onclick="${i.onclick}"><text style="margin: 0px !important; margin-top: auto !important; margin-bottom: auto !important;">${i.label}</text></btn>
          `
    }).join('')}
      </div>
    `
  }

  queryType.forEach((type) => {
    if (!endResults[type]?.length) return
    resultsFound++
    results.innerHTML += `
      <text>Results for ${type}</text>
      ${endResults[type].map(i => toHTML(i)).join('')}
      <div style="margin-bottom: 5px;"></div>
    `
  })

  if (resultsFound == 0) {
    results.innerHTML = `
    <btext style="margin: auto; text-align: center; display: block;" class="fade">Oof.. nothing to see here</btext>
    `
  }
  setTimeout(() => {
    results.style.height = '270px'
  }, 30);
}


function refreshIntents() {
  return
  if (!botData.intents) {
    botData.intents = ["all"]
    saveLocally()
  }

  document.getElementById('intents').innerHTML = ''

  let intents = {
    all: "All",
    guildMessages: "Guild Messages",
    messageContent: "Messages Content",
    guilds: "Guilds",
    guildExpressions: "Guild Expressions",
    directMessages: "Direct Messages",
    guildIntegrations: "Guild Integrations",
    guildMembers: "Guild Members",
    guildInvites: "Guild Invites",
    guildPresence: "Guild Presences",
    guildModeration: "Guild Moderation",
    typingMessages: "Guild Message Typing",
  }

  for (let i in intents) {
    let intent = intents[i]
    document.getElementById('intents').innerHTML += `<div class="hoverablez dimension" onclick="toggleIntent('${i}', this)" style="padding: 9px; border-radius: 9px; width: 200px; margin: 3.5px; transition: all 0.1s ease; ${botData.intents.includes(i) ? "background: var(--accent)" : ""}"><btext>${intent}</btext></div>`
  }
}

function toggleIntent(intent, e) {
  if (botData.intents.includes(intent)) {
    e.style.background = ''
    for (let i in botData.intents) {
      if (botData.intents[i] == intent) {
        botData.intents.splice(i, 1)
        saveLocally()
      }
    }
  } else {
    botData.intents.push(intent)
    e.style.background = 'var(--accent)'
    saveLocally()
  }
}

function dupe(from, target) {
  fs.writeFileSync(from, fs.readFileSync(target, 'utf8'))
}

function saveSettings() {
  fs.writeFileSync(
    path + "/EditorSettings.json",
    JSON.stringify(settings),
  );
}



if (settings.lastVersionOpened != version) {
  // toggleSearch();
  // searchBar.style.height = '500px'
  // searchBar.style.padding = '12px'

  // let endHTML = ``

  // if (changelog.actions) {
  //   let end = `
  //     <btext style="font-size: 22px; opacity: 0.7;">New Actions</btext>
  //   `
  //   changelog.actions.forEach(act => {
  //     let action = require(`${process.cwd()}/AppData/Actions/${act}`);
  //     end += `
  //     <div class="flexbox" style="margin-top: 4px;  z-index: 0;">
  //       <btn onclick="seeInAction('${act}')"><btext>See In Action</btext></btn>
  //       <btext style="opacity: 0.9; margin-left: 12px; margin-right: 0px;  z-index: 0;">${action.data.name}</btext>
  //       <div class="image folder" style="margin-right: 3px;                z-index: 0; margin-left: 10px; width: 13px; height: 13px;"></div>
  //       <div style="font-size: 14px; margin-top: auto; margin-bottom: 6px; z-index: 0; margin-right: auto; opacity: 0.8;">${action.category || "Uncategorized"}</div>
  //     </div>
  //     `
  //   });

  //   endHTML += `${end}<div class="sepbars" style="opacity: 0;"></div>`
  // }

  // if (changelog.updatedActions) {
  //   let end = `
  //     <btext style="font-size: 22px; opacity: 0.7;">Updated Actions</btext>
  //   `
  //   changelog.updatedActions.forEach(act => {
  //     let action = require(`${process.cwd()}/AppData/Actions/${act.action}`);
  //     end += `
  //       <div style="margin-top: 3px;">
  //       <btext style="opacity: 0.9; margin-left: 0px; margin-right: 0px; width: 100%; text-align: left; display: block;">${action.data.name}
  //       </btext>
  //       <btext style="opacity: 0.9; margin-left: 0px; width: 100%; display: block; text-align: left; margin-right: 0px; font-size: 12px; opacity: 0.6;">${act.update}</btext>
  //       </div>
  //     `
  //   });

  //   endHTML += `${end}<div class="sepbars" style="opacity: 0;"></div>`
  // }

  // if (changelog.updatedEditor) {
  //   let end = `
  //     <btext style="font-size: 22px; opacity: 0.7;">Editor Updates</btext>
  //   `
  //   changelog.updatedEditor.forEach(update => {
  //     end += `
  //       <div style="margin-bottom: 15px;">
  //       <btext style="opacity: 0.5; margin-left: 0px;  z-index: 0; margin-right: 0px; font-size: 10px; text-align: left; display: block; transform: scaleX(1.30); transform-origin: left;">${update.type.toUpperCase()}</btext>
  //       <btext style="opacity: 0.9; margin-left: 0px;  z-index: 0; margin-right: 0px; width: 100%; text-align: left; display: block;">${update.name}</btext>
  //       <btext style="opacity: 0.9; margin-left: 0px;  z-index: 0; width: 100%; display: block; text-align: left; margin-right: 0px; font-size: 12px; opacity: 0.6;">${update.description}</btext>
  //       </div>
  //     `
  //   });

  //   endHTML += `${end}<div class="sepbars" style="opacity: 0;"></div>`
  // }

  // searchBar.innerHTML = `
  // <btext style="font-size: 24px;">Just Updated - What's New? <span onclick="toggleSearch()" style="padding: 3px; font-size: 16px; border-radius: var(--round-mild); margin-left: 0px;" class="hoverablez">Dismiss</span></btext>
  // <div class="sepbars" style="width: 100%;"></div>
  // <div style="width: 100%; overflow-y: auto; overflow-x: hidden; height: 465px; z-index: 0; display: block;">
  // ${endHTML}
  // </div>
  // `
}

function countUppercaseLetters(str) {
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] >= 'A' && str[i] <= 'Z') {
      count++;
    }
  }
  return count;
}

function runAutomation(automationID) {
  let search = document.getElementsByClassName('search')[0];

  let automation = require(`./Automations/${automationID}/main.js`);
  let automationData = require(`./Automations/${automationID}/data.json`);

  automation.run({
    showInterface: (UI, data) => {
      ipcRenderer.send(`openCustom`, {
        data: data || { name: automationData.name },
        UI,
        name: automationData.name,
        actionType: 'text',
      });

      return new Promise((res) => {
        ipcRenderer.once('menuData', (event, data) => {
          setTimeout(() => {
            res(data);
          }, 10);
        })
      })
    },
    eval,
    burstInform: (message) => {
      search.innerHTML = `
      <btext>${message}</btext>
      `
    },
    result: (message) => {
      search.style.opacity = 0;
      search.style.padding = '0px'
      setTimeout(() => {
        search.style.padding = '15px'
        search.innerHTML = `
          <btext>${message}</btext>
        `
        setTimeout(() => {
          if (searchBar) {
            toggleSearch()
          }
        }, 3000);

        search.style.opacity = 1;
      }, editorSettings.commonAnimation * 100);

    }
  });

  search.style.opacity = 0;
  setTimeout(() => {
    search.style.padding = '15px'
    search.innerHTML = `
      <btext class="fadeinout" style="animation-iteration-count: infinite;">${automationData.name} is running...</btext>
    `
    search.style.opacity = 1;
  }, editorSettings.commonAnimation * 100);
}