window.oncontextmenu = function (event) {
  if (!menu) {
    setTimeout(() => {
      showCustomMenu(event.clientX, event.clientY);
    }, 200);
  }
  showCustomMenu(event.clientX, event.clientY);
  return false;
};
let mOpened = false;

function getVars(type, eID) {
  foundVarType = [...commandVars, ...tempVars]
  if (type == 'server') {
    foundVarType = [...thisServer, ...serverVars]
  } else if (type == 'global') {
    foundVarType = [...thisGlobal, ...globalVars]
  }

  let used = [];
  let endHTML = ''
  if (type == 'command') {
    let rawVariables = ownSettings.commandVariables;
    let variables = {}

    for (let variable in rawVariables) {
      if (!rawVariables[variable].commandTypeLimits.length || rawVariables[variable].commandTypeLimits.includes(actionType)) {
        variables[variable] = rawVariables[variable]
      }
    }

    for (let type in variables) {
      endHTML += `
        <div class="dimension hoverablez contextMenuOption" onclick="setVariableIn('${type}', '${variables[type].value}', '${eID}')"><btext>
        ${type}
        </btext></div>
        `;
    }
  } else {
    for (let variable in foundVarType) {
      try {
        if (foundVarType[variable].trim() != "" && !used.includes(foundVarType[variable])) {
          used.push(foundVarType[variable])
          endHTML += `
            <div class="dimension hoverablez contextMenuOption" onclick="setVariableIn('${type}', '${foundVarType[variable].replaceAll("'", "\\'")}', '${eID}')" ><btext>${foundVarType[variable]}</btext></div>
            `;
        }
      } catch (err) { console.error(err) }
    }
  }

  setTimeout(() => {
    document.getElementById('vars-temporary').classList.remove('highlighted')
    document.getElementById('vars-server').classList.remove('highlighted')
    document.getElementById('vars-global').classList.remove('highlighted')
    try {
      document.getElementById('vars-command').classList.remove('highlighted')
    } catch (error) { }
    document.getElementById(`vars-${type}`).classList.add('highlighted')
  }, 100);

  return (endHTML || `<btext style='margin: auto; margin-top: 4px; opacity: 0.5; display: block !important;'>Your variables will appear here!</btext>`)
}

function showCustomMenu(x, y) {
  let computedHeight = 'auto'
  if (!menu) {
    menu = document.createElement("div");
    document.body.appendChild(menu);
    menu.className = "right_click_menu";
  }
  // Calculate the maximum allowed coordinates based on window dimensions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const maxX = windowWidth - menuWidth;
  const maxY = windowHeight - menuHeight;
  let adjustedScale = 1;
  // Adjust the menu position if it exceeds the window boundaries
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
  menu.style.maxHeight = '400px'

  menu.style.scale = adjustedScale;
  menu.style.opacity = `1`;

  let type = 'indirect'
  menu.onmouseenter = () => {
    mOpened = true;
  }
  menu.onmouseleave = () => {
    setTimeout(() => {
      mOpened = false;
    }, 20);
  }

  if (actionType != 'event') {
    menu.innerHTML = `
    <div class="flexbox">
    <div class="hoverablez dimension buttontexta" id="vars-command" style="padding: 2px; width: 26%; margin-left: 1%; overflow: auto; transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU', '${document.activeElement.id}').innerHTML = getVars('command', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Command</div>
    <div class="hoverablez dimension buttontexta highlighted" id="vars-temporary" style="padding: 2px; width: 26%; overflow: auto; transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU', '${document.activeElement.id}').innerHTML = getVars('temporary', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Temporary</div>
    <div class="hoverablez dimension buttontexta" id="vars-server" style="padding: 2px; width: 19%; overflow: auto;    transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU').innerHTML = getVars('server', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Server</div>
    <div class="hoverablez dimension buttontexta" id="vars-global" style="padding: 2px; width: 19%; margin-right: 1%; overflow: auto;    transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU').innerHTML = getVars('global', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Global</div>
    </div>

    <div id="VARINSMENU">
    </div>
    <div></div>
    `;
  } else {
    menu.innerHTML = `
    <div class="flexbox">
    <div class="hoverablez dimension buttontexta highlighted" id="vars-temporary" style="padding: 2px; width: 36%; margin-left: 1%; overflow: auto; transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU', '${document.activeElement.id}').innerHTML = getVars('temporary', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Temporary</div>
    <div class="hoverablez dimension buttontexta" id="vars-server" style="padding: 2px; width: 28%; overflow: auto;    transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU').innerHTML = getVars('server', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Server</div>
    <div class="hoverablez dimension buttontexta" id="vars-global" style="padding: 2px; width: 28%; margin-right: 1%; overflow: auto;    transition: all .1s ease; border-radius: 4px; margin-bottom: 3px; margin-top: 3px; font-size: 17.5px;" onclick="document.getElementById('VARINSMENU').innerHTML = getVars('global', '${document.activeElement.id}'); document.getElementById('${document.activeElement.id}').focus()">Global</div>
    </div>

    <div id="VARINSMENU"></div>
    <div></div>
    `;
  }


  setTimeout(() => {
    document.getElementById('VARINSMENU').innerHTML = getVars('temporary', `${document.activeElement.id}`)
  }, 10);

  if (document.activeElement.tagName.toLowerCase() == 'input' || document.activeElement.tagName.toLowerCase() == 'textarea') {
    menu.style.width = '348px'
    if (variableInsertionData.type) {
      type = variableInsertionData.type;
    } else if (variableInsertionData.accept == false || variableInsertionData.accept) {
      type = variableInsertionData.accept ? 'indirect' : 'off'
    } else if (variableInsertionData.direct) {
      type = 'direct'
    } else if (variableInsertionData.custom) {
      let direct = ['tempVar', 'cmdVar', 'serverVar', 'globVar'];

      let UIelement = actionUI[variableInsertionData.elementIndex];
      if (direct.includes(action.data[UIelement.storeAs].type)) {
        type = action.data[UIelement.storeAs].type
      }
    }
  } else {
    menu.style.width = ''
    menu.innerHTML = ``;
    if (lastHovered != undefined) {
      menu.innerHTML += `
            <div class="dimension hoverablez contextMenuOption" onclick="copyAction('${lastHovered}', '${lastActionContainer}'); closeContextmenu();"><btext>Copy</btext></div>
            `;
    }

    if (lastActionContainer) {
      ipcRenderer.send('getCopiedAction');
      ipcRenderer.once('copiedAction', (event, Action) => {
        if (Action) {
          menu.innerHTML += `
        <div class="dimension hoverablez contextMenuOption" onclick="pasteCopiedIn('${lastActionContainer}', '${lastHovered}');">
        <btext>Paste</btext>
        <btext style="opacity: 0.5; width: 100%;">${Array.isArray(Action) ? `${Action.length} Action${Action.length != 1 ? "s" : ""}` : Action.name}</btext>
        </div>
        `;
        }

        menu.innerHTML += `
        <flexbox>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="deleteAction('${lastActionContainer}', '${lastHovered}'); closeContextmenu(true);"><btext>Delete</btext></div>
        <div class="dimension hoverablez contextMenuOption halfMenuOption" onclick="navigator.clipboard.writeText('${action.data[lastActionContainer][lastHovered].id}'); closeContextmenu(true);"><btext>Copy ID</btext></div>
        </flexbox>`
      });
    }

    if (lastHoveredContainer) {
      if (highlights[lastHoveredContainer].type == 2) {
        if (lastHoveredMenu) {
          menu.innerHTML += `
          <div class="dimension hoverablez contextMenuOption" onclick="
          ipcRenderer.send('copiedMenu', highlights['${lastHoveredContainer}'].selected.length != 0 ? highlights['${lastHoveredContainer}'].selected.map((value, index) => action.data['${lastHoveredContainer}'][index]) : action.data['${lastHoveredContainer}'][${lastHoveredMenu.object}]);
          closeContextmenu(true);"><btext>Copy</btext></div>
            `
        }
        ipcRenderer.send('getCopiedMenu');
        ipcRenderer.once('copiedMenu', (event, Menu) => {
          if (Menu) {
            menu.innerHTML += `
            <div class="dimension hoverablez contextMenuOption" onclick="pasteMenuIn('${lastHoveredContainer}');"><btext>Paste <span style="opacity: 0.5;">${Array.isArray(Menu) ? Menu.length : "1"} Element${(Array.isArray(Menu) ? Menu.length : 1) != 1 ? "s" : ""}</span></btext></div>`
            if (action.data[highlights[lastHoveredContainer].menu]) {
              menu.innerHTML += `
              <div class="dimension hoverablez contextMenuOption" onclick="pasteMenuIn('${lastHoveredContainer}', '${lastHoveredMenu ? lastHoveredMenu.object : action.data[lastHoveredContainer].length}');"><btext>Copy</btext></div>`
            }
          }
          if (lastHoveredMenu) {
            if (actionUI[lastHoveredMenu.menu].max != action.data[actionUI[lastHoveredMenu.menu].storeAs].length) {
              menu.innerHTML += `
              <div class="dimension hoverablez contextMenuOption" onclick="deleteMenuOption('${lastHoveredMenu.object}', '${lastHoveredMenu.menu}'); closeContextmenu();"><btext>Delete</btext></div>
              `

            }
          }
        })
      }
    }

  }
}

function closeContextmenu(force) {
  if (menu && !mOpened || force) {
    menu.style.scale = "";
    menu.style.opacity = "";
    setTimeout(() => {
      menu.remove();
      menu = undefined;
    }, 200);
  }
}

function copyAction(Action, container) {
  if (highlights[container].selected.length != 0) {
    ipcRenderer.send('copiedAction', highlights[container].selected.map((value) => action.data[container][value]));
  } else {
    ipcRenderer.send('copiedAction', action.data[`${container}`][`${Action}`]);
  }
  closeContextmenu(true)
}

function pasteCopiedIn(container, Action) {
  ipcRenderer.send('getCopiedAction');
  ipcRenderer.once('copiedAction', (event, _Action) => {
    let pasteIndex = action.data[container].length - 1;
    if (action.data[container][Action]) {
      pasteIndex = Number(Action) + 1;
    }

    if (_Action) {
      if (Array.isArray(_Action)) {
        _Action.forEach(act => {
          action.data[container].splice(pasteIndex, 0, act);
          pasteIndex++
        });
      } else {
        action.data[container].splice(Number(highlights[container].highlighted) + 1, 0, _Action)
      }
    }
    refreshActions(container)
  });

  closeContextmenu(true)
}

function pasteMenuIn(container, menu) {
  ipcRenderer.send('getCopiedMenu');
  ipcRenderer.once('copiedMenu', (event, unhandledMenu) => {
    if (!unhandledMenu) return
    if (document.getElementById(actionUI[highlights[container].menu].storeAs).getElementsByClassName('backArrow').length) {
      document.getElementById(actionUI[highlights[container].menu].storeAs).getElementsByClassName('backArrow')[0].parentElement.style.opacity = '0'
    }

    let Menu;

    let menuObject = actionUI[highlights[container].menu]
    let max = menuObject.max;
    let current = action.data[container].length;

    if (Array.isArray(unhandledMenu)) {
      Menu = []

      unhandledMenu.forEach(item => {
        if (Object.keys(menuObject.types).includes(item.type)) {
          current++
          if (current < max) {
            Menu.push(item)
          }
        }
      })
    } else {
      if (Object.keys(menuObject.types).includes(unhandledMenu.type)) {
        Menu = unhandledMenu;
      }
    }

    let pasteIndex = action.data[container].length - 1;
    if (action.data[container][menu]) {
      pasteIndex = Number(menu) + 1;
    }

    if (Menu) {
      if (Array.isArray(Menu)) {
        Menu.forEach(_menu => {
          action.data[container].splice(pasteIndex, 0, _menu);
          pasteIndex++
        });
      } else {
        if (current != max) {
          action.data[container].push(Menu)
        }
      }
    }

    refreshMenuItems(highlights[container].menu, action.data[container].length != 1, action.data[container].length == 1)
  });

  closeContextmenu(true)
}


document.addEventListener('keydown', (key) => {
  if (document.activeElement.tagName != "BODY") return;

  if (key.ctrlKey) {
    isHoldingCTRL = true;
    let offListener = (key) => {
      if (key.ctrlKey) return;
      isHoldingCTRL = false;
      document.removeEventListener('keyup', offListener)
    };
    document.addEventListener('keyup', offListener)
  }

  if (key.key.toLowerCase() == 'a' && key.ctrlKey) {
    if (document.activeElement.tagName != 'BODY') return;
    if (highlights[lastContainer].type == 1) {
      refreshActions(lastContainer);

      setTimeout(() => {
        const initiallySelected = highlights[lastContainer].highlighted
        action.data[lastContainer].forEach((value, index) => {
          if (index == initiallySelected) return;
          isHoldingCTRL = true;
          highlightAction(lastContainer, index);
        });
        isHoldingCTRL = false;
        highlights[lastContainer].selected = highlights[lastContainer].selected.sort((a, b) => a - b)
      }, 10);
    }
  }

  if (key.key.toLowerCase() == 'c' && key.ctrlKey == true) {
    let highlighted = highlights[lastContainer];

    let sendChannel = highlighted.type == 1 ? "copiedAction" : "copiedMenu"
    ipcRenderer.send(sendChannel, highlighted.selected.length != 0 ? highlighted.selected.map((value) => action.data[lastContainer][value]) : action.data[lastContainer][highlighted.highlighted])
  }

  if (key.key.toLowerCase() == 'v' && key.ctrlKey == true) {
    if (lastContainer) {
      if (highlights[lastContainer].type == 1) {
        pasteCopiedIn(lastContainer)
      } else {
        pasteMenuIn(lastContainer)
      }
    }
    else {
      if (!editorSettings.experiments) return;
      ipcRenderer.send('getCopiedAction');
      ipcRenderer.once('copiedAction', (event, Action) => {
        let containers = 0;
        actionUI.forEach(element => {
          let container;
          if (element.element == 'actions') {
            container = document.getElementById(element.storeAs)
            containers++
          } else if (element.element == 'case' || element.element == 'condition') {
            if (action.data[element.storeAs].type == 'runActions') {
              container = document.getElementById(element.storeActionsAs)
              containers++
            }
          }

          if (container) {
            container.previousElementSibling.style.scale = 0
            setTimeout(() => {
              container.style.height = '14vh'
              container.style.filter = 'blur(12px)'
              setTimeout(() => {
                container.innerHTML = `
              <div class="flexbox">
              <btext style="margin: auto; text-align: center; width: 100%; margin-bottom: 1vh;">Pasting <span style="opacity: 50%;">${Action.name}</span></btext>
              <div class="hoverablez dimension" style="padding: 10px; padding-left: 30px; padding-right: 30px; border-radius: 10px;">
              <btext>Paste Here</btext>
              <div class="smalltext" style="opacity: 50%; font-size: 10px;">CTRL+${containers}</div>
              </div>
              <div class="hoverablez dimension flexbox" style="padding: 10px; border-radius: 10px; margin-left: 1vw; width: 10vw;"><btext>Cancel</btext>
              <div class="smalltext" style="opacity: 50%; font-size: 10px;">CTRL+E</div>
              </div>
              </div>
              `
              }, 100);
              setTimeout(() => {
                container.style.filter = 'blur(0px)'
              }, 200);
            }, 200);
          }
        });
      });
    }
  }
})


function setVariableIn(type, varName, elementId) {
  closeContextmenu()

  if (type == 'temporary') {
    insertTextAtCaret("${tempVars('" + varName + "')}", elementId);
  } else if (type == 'server') {
    insertTextAtCaret("${serverVars('" + varName + "')}", elementId);
  } else if (type == 'global') {
    insertTextAtCaret("${globalVars('" + varName + "')}", elementId);
  } else {
    insertTextAtCaret(varName, elementId);
  }

  setTimeout(() => {
    mOpened = false;
    closeContextmenu()
  }, 150)
}

function insertTextAtCaret(text, elementId) {
  var element = document.getElementById(elementId);
  element.blur()
  if (element && (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input')) {
    var start = element.selectionStart;
    var end = element.selectionEnd;
    var newValue = element.value.substring(0, start) + text + element.value.substring(end);
    element.value = newValue;
  }
  element.blur()
  element.focus()
}

function varTool(elm, index) {
  let element = actionUI[index]
  let validTypes = {
    tempVar: "Temporary Variable",
    serverVar: "Server Variable",
    globVar: "Global Variable"
  }
  if (!validTypes[action.data[element.storeAs].type]) {
    return
  }
  let parent = elm;
  if (elm?.parentElement?.id) {
    parent = elm.parentElement
  }

  let selectorParent = document.createElement('div');
  selectorParent.style.width = '100%';
  selectorParent.style.height = '0px';
  selectorParent.style.transition = 'height 0.2s ease'

  let selector = document.createElement('div');
  selectorParent.appendChild(selector);
  selector.classList.add('variableInsertion')

  setTimeout(() => {
    selector.style.scale = '1'
    selector.style.opacity = '1'
    elm.style.borderBottomRightRadius = '0px'
  }, 10);
  elm.onblur = () => {
    elm.style.borderBottomRightRadius = ''
    action.data[actionUI[index].storeAs].value = elm.value;
    selector.style.opacity = ''
    selector.style.scale = ''

    setTimeout(() => {
      selector.style.height = '0vh'
      selector.style.padding = '0px'
    }, editorSettings.commonAnimation * 100);
    setTimeout(() => {
      selector.remove()
      selectorParent.remove()
    }, editorSettings.commonAnimation * 200);
  }
  selectorParent.appendAfter(parent);

  let displayType = 'Temporary';

  let localVariables = [...commandVars, ...tempVars];

  switch (action.data[element.storeAs].type) {
    case 'serverVar':
      localVariables = [...thisServer, ...serverVars];
      displayType = 'Server'
      break
    case 'globVar':
      localVariables = [...thisGlobal, ...globalVars];
      displayType = 'Global'
      break
  }

  elm.oninput = () => {
    var endVars = ''
    var includedVars = [];

    let query = elm.value;
    let results = 0;
    for (var varIndex in localVariables) {
      var variable = localVariables[varIndex];
      if (variable.trim() != '' && !includedVars.includes(variable) && (fuzzyMatch(variable.toLowerCase().replaceAll('', ' '), query.toLowerCase().replaceAll(' ', ''), 0.01) || variable.toLowerCase().replaceAll(' ', '').includes(query.toLowerCase().replaceAll(' ', '')))) {
        results++
        includedVars.push(variable)
        endVars += `
        <div class="action fade textToLeft" onmousedown="document.getElementById('${elm.id}').value = this.firstElementChild.nextElementSibling.innerText">
        <text class="indicator">${displayType}</text>
          <div>
          ${variable}
          </div>
        </div>
        `
      }
    };

    selector.innerHTML = endVars;
  }

  elm.oninput()
}