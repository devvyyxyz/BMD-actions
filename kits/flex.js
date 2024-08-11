let variableInsertionData = {}

const EventEmitter = require('events');

let actionEvents = new EventEmitter();

function refreshUI() {
  document.getElementById('editorContent').innerHTML = getUIelements(actionUI, false, true)
}

function emitChange(changed) {
  actionEvents.emit('change', {
    data: action.data,
    type: actionType,
    UI: actionUI,
    document: document,
    events: actionEvents,
    changed,
    extra: globalData || null,
    updateUI: refreshUI
  })
}

function createDropdown(element, hasField, translations, index, defaultName, toRun) {
  return `
      <text style="margin-top: -1px;">${element.name ? element.name : defaultName}</text>
      <div class="flexbox" style='width: 100%; margin: auto; display: flexbox; justify-content: center;'>
      <div style="height: 30.8px; margin-right: ${!hasField ? '0vw' : 'var(--dropdown-paddingLeft)'}; transition: margin-right 0.3s ease;">
      <div onclick="openTypedDropdown('${element.storeAs}', ${index}, ${JSON.stringify(translations).replaceAll(`'`, '\\\'').replaceAll('"', "'")}, ${typeof toRun == 'object' ? "" : toRun})" id="${element.storeAs}" class="dropdown ${!hasField ? '' : 'borderright'}" style="width: ${!hasField ? 'calc(var(--width-in-editor) - 12px)' : 'var(--width-in-otherhalf-dropdown)'};  transition: all 0.3s ease;">${translations[action.data[element.storeAs].type].name}</div>
      </div>  
      <input onfocus="varTool(this, ${index})" onmouseover="variableInsertionData = {elementIndex: ${index}}" value="${action.data[element.storeAs].value.replaceAll(`"`, `&quot;`)}" onblur="action.data['${element.storeAs}'].value = this.value; ${typeof toRun == 'object' ? toRun.onblur : ""}" class="borderleft" id="${element.storeAs}input" style="width: ${!hasField ? '0vw; padding: 0px !important; height: 0px;' : 'calc(var(--width-in-editor) - var(--width-in-half-dropdown)); height: 30.8px;'}; font-size: 23px; display: block; transition: all 0.3s ease; margin: 0px !important;">
      </div>
      `
}

function getUIelements(UI, excludeTitle, excludeScript, options) {
  let additional = ''
  let indexOffset = 0;

  let endHTML = `
  <div class="flexbox editor_subtitle_container">
  <btext style="margin-left: 8px; margin-top: 0px;">${action.name}
  ${additional}
  </btext>
  </div>
  `;

  if (excludeTitle == true) {
    endHTML = ''
  } else {
    endHTML += '<div class="sepbars noanims" style="width: var(--width-in-editor);"></div>'
  }
  let pendingMenus = [];
  let pendingActions = [];
  let pendingTabs = [];

  for (let index in UI) {
    let realIndex = Number(index)
    let element = UI[index];

    if (typeof UI[index] == 'string') {
      if (UI[index] == '' || UI[index] == 'sep' || UI[index] == 'sepbar' || UI[index] == '-') {
        endHTML += '<div class="sepbars noanims" style="width: var(--width-in-editor);"></div>'
      }
      if (UI[index] == '_') {
        endHTML += `<div style="margin-bottom: 5px"></div>`
      }
    } else {
      if (options?.starterIndex) {
        index = index + (options.starterIndex || 0);
      }

      index = Number(index) + indexOffset;

      try {
        if (element.element == 'input') {
          element.type = undefined;
          if (!action.data[element.storeAs]) {
            action.data[element.storeAs] = ''
          }

          endHTML += `<text>${element.name}</text><input type="${element.type == 'color' ? "color" : "text" }" class="noanims" id="${element.storeAs}" style="width: var(--width-in-editor) !important;" onmouseover="variableInsertionData = {accept: true, type: 'indirect'}" onblur="action.data['${element.storeAs}'] = document.getElementById('${element.storeAs}').value" value="${`${action.data[element.storeAs]}`.replaceAll(`"`, `&quot;`)}" placeholder="${element.placeholder ? element.placeholder : ''}"></input>`
        }

        if (element.element == 'largeInput') {
          if (!action.data[element.storeAs]) {
            action.data[element.storeAs] = ''
          }
          endHTML += `<text>${element.name}</text><textarea class="largeInput" id="${element.storeAs}" placeholder="${element.placeholder || ""}" onmouseover="variableInsertionData = {accept: true, type: 'indirect'}" onblur="action.data['${element.storeAs}'] = document.getElementById('${element.storeAs}').value;">${action.data[element.storeAs]}</textarea>`
        }


        if (element.element == 'inputGroup') {
          if (!action.data[element.storeAs[0]]) {
            action.data[element.storeAs[0]] = ''
          }

          if (!action.data[element.storeAs[1]]) {
            action.data[element.storeAs[1]] = ''
          }

          endHTML += `
      <div class="flexbox" style="width: var(--width-in-editor); margin-left: auto; margin-right: auto;">
      <div style="width: 49.75%;">
        <text style="margin-left: 4px;">${element.nameSchemes[0]}</text>
        <input style="width: 100%;" id="${element.storeAs[0]}" class="noanims" placeholder="${element.placeholder ? element.placeholder[0] : ''}" onmouseover="variableInsertionData = {accept: true, type: 'indirect'}" onblur="action.data['${element.storeAs[0]}'] = this.value" value="${action.data[element.storeAs[0]].replaceAll(`"`, `&quot;`)}">
      </div>
      <div style="width: 49.75%; margin-left: 0.5%;">
      <text style="margin-left: 4px;">${element.nameSchemes[1]}</text>
        <input style="width: 100%;" id="${element.storeAs[1]}" class="noanims" placeholder="${element.placeholder ? element.placeholder[1] : ''}" onmouseover="variableInsertionData = {accept: true, type: 'indirect'}" onblur="action.data['${element.storeAs[1]}'] = this.value" value="${action.data[element.storeAs[1]].replaceAll(`"`, `&quot;`)}">
      </div>
      </div>
      `
        }

        if (element.element == 'toggle') {
          if (!action.data[element.storeAs]) {
            action.data[element.storeAs] = false
          }

          endHTML += studioUI.toggle({ state: (action.data[element.storeAs] == true || action.data[element.storeAs] == 'true') ? true : false, true: element.true, false: element.false, name: element.name }, `action.data['${element.storeAs}'] = (this.dataset.state == 'true')`)
        }

        if (element.element == 'toggleGroup') {
          if (!action.data[element.storeAs[0]]) {
            action.data[element.storeAs[0]] = false
          }
          if (!action.data[element.storeAs[1]]) {
            action.data[element.storeAs[1]] = false
          }

          let leftWidth = `(var(--width-in-editor) / 2 + 4px)`;
          let rightWidth = `(var(--width-in-editor) / 2 + 4px)`;

          if (element.prefer == 0) {
            leftWidth = `((var(--width-in-editor) / 1.6) - 13.5px)`
            rightWidth = `((var(--width-in-editor) / 2.4) - 13.5px)`
          }
          if (element.prefer == 1) {
            rightWidth = `((var(--width-in-editor) / 1.6) - 13.5px)`
            leftWidth = `((var(--width-in-editor) / 2.4) - 13.5px)`
          }

          endHTML += `
            <div class="flexbox" style="margin: auto;">
              ${studioUI.toggle({ style: `width: calc(${leftWidth} - var(--padding-super)); margin-right: 2px !important; margin-bottom: 0px; margin-top: 0px !important;`, state: (action.data[element.storeAs[0]] == true || action.data[element.storeAs[0]] == 'true') ? true : false, true: element.true ? element?.true[0] : null, false: element.false ? element?.false[0] : null, name: element?.nameSchemes[0] }, `action.data['${element.storeAs[0]}'] = (this.dataset.state == 'true')`)}
              ${studioUI.toggle({ style: `width: calc(${rightWidth} - var(--padding-super)); margin-left: 2px !important; margin-bottom: 0px; margin-top: 0px !important;`, state: (action.data[element.storeAs[1]] == true || action.data[element.storeAs[1]] == 'true') ? true : false, true: element.true ? element?.true[1] : null, false: element.false ? element?.false[1] : null, name: element?.nameSchemes[1] }, `action.data['${element.storeAs[1]}'] = (this.dataset.state == 'true')`)}
            </div>`
        }

        if (element.element == 'storageInput' || element.element == 'storage' || element.element == 'store') {
          let translations = {
            temporary: { name: "Temporary Variable", field: true },
            server: { name: "Server Variable", field: true },
            global: { name: "Global Variable", field: true }
          }

          if (element.optional) {
            translations.none = { name: "None", field: false }
          }

          if (!action.data[element.storeAs]) {
            if (element.optional) {
              action.data[element.storeAs] = { type: "none", value: "" }
            } else {
              action.data[element.storeAs] = { type: "temporary", value: "" }
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            if (element.optional) {
              action.data[element.storeAs].type = 'none'
            } else {
              action.data[element.storeAs].type = 'temporary'
            }
          }


          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Store As', { onblur: "recacheOwnVariables()" })
        }

        if (element.element == 'memberInput' || element.element == 'userInput' || element.element == 'member' || element.element == 'user') {
          let translations = {}

          if (actionType == 'text') {
            translations.mentioned = { name: "Mentioned User", field: false }
            translations.author = { name: "Command Author", field: false }
          } else if (actionType == 'slash') {
            translations.author = { name: "Command Author", field: false }
          } else if (actionType == 'message') {
            translations.author = { name: "Command Author", field: false }
            translations.messageAuthor = { name: "Message Author", field: false }
          } else if (actionType == 'user') {
            translations.author = { name: "Command Author", field: false }
            translations.user = { name: "Command User", field: false }
          }

          translations.id = { name: "User ID", field: true };

          if (element.also) {
            for (let o in element.also) {
              let also = element.also[o];
              translations[o] = { name: also, field: true }
            }
          }

          if (element.and) {
            for (let o in element.and) {
              if (translations[o]) {
                let and = element.and[o];
                translations[o].field = and;
              }
            }
          }

          if (element.additionalOptions) {
            translations = {
              ...element.additionalOptions,
              ...translations
            }
          }

          translations.tempVar = { name: "Temporary Variable", field: true }
          translations.serverVar = { name: "Server Variable", field: true }
          translations.globVar = { name: "Global Variable", field: true }

          if (!action.data[element.storeAs]) {
            let type = 'id';

            if (actionType == 'text' || actionType == 'slash' || actionType == 'message' || actionType == 'user') {
              type = 'author'
            }

            action.data[element.storeAs] = {
              type,
              value: ""
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            action.data[element.storeAs].type = 'id'
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'User')
        }

        if (element.element == 'halfDropdown' || element.element == 'dropdown') {
          let foundChoice;

          if (!element.preventRecovery) {
            if (!action.data[element.storeAs]) {
              action.data[element.storeAs] = element.choices[0].name;
            }

            if (!action.data[element.extraField] && element.extraField) {
              action.data[element.extraField] = '';
            }

            for (let choice of element.choices) {
              if (choice.name == action.data[element.storeAs]) {
                foundChoice = choice;
              }
            }

            if (!foundChoice) {
              action.data[element.storeAs] = element.choices[0].name
              foundChoice = element.choices[0]
            }
          } else {
            foundChoice = {
              name: action.data[element.storeAs] || element.choices[0].name
            }
          }

          let text = `<text style="margin-top: -1.5px;">${element.name}</text>`
          if (!element.name) {
            text = ''
          }
          endHTML += `
            ${text}
      <div class="flexbox" style='width: 100%; margin: auto; display: flexbox; justify-content: center; margin-bottom: 6px;'>
      <div style="height: ${element.forcePush == true ? 'unset' : '30.8px'}; margin-right: ${!foundChoice?.field ? '0vw' : 'var(--dropdown-paddingLeft)'}; transition: margin-right 0.3s ease;">
      <div onclick="openHalfDropdown('${element.storeAs}', ${index})" id="${element.storeAs}" class="dropdown ${!foundChoice?.field ? '' : 'borderright'}" style="width: ${!foundChoice?.field ? 'calc(var(--width-in-editor) - 12px)' : 'var(--width-in-otherhalf-dropdown)'};  transition: all 0.3s ease;">${foundChoice.name}</div>
      </div>
      <input placeholder="${foundChoice.placeholder ? foundChoice.placeholder : ''}" onmouseover="variableInsertionData = {custom: true, elementIndex: ${index}}" value="${action.data[element.extraField] ? `${action.data[element.extraField]}`?.replaceAll(`"`, `&quot;`) : ""}" onblur="action.data['${element.extraField}'] = this.value" class="borderleft" id="${element.storeAs}input" style="width: ${!foundChoice.field ? '0vw; padding: 0px !important; height: 0px;' : 'calc(var(--width-in-editor) - var(--width-in-half-dropdown)); height: 30.8px;'}; font-size: 23px; display: block; transition: all 0.3s ease; margin: 0px !important;">
      </div>
      `
        }

        if (element.element == 'typedDropdown' || element.element == 'typed') {
          let translations = element.choices;

          if (!action.data[element.storeAs]) {
            let type = translations[0];

            action.data[element.storeAs] = {
              type,
              value: ""
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            action.data[element.storeAs].type = Object.keys(translations)[0];
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, element.name || "")
        }

        if (element.element == 'channelInput' || element.element == 'channel') {
          let translations = {}

          if (element.optional) {
            translations.none = { name: "None", field: false }
          }

          if (actionType == 'text' || actionType == 'message') {
            translations.command = { name: "Command Channel", field: false }
            translations.mentionedChannel = { name: "Mentioned Channel", field: false }


            if (!element.excludeUsers) {
              translations.commandAuthor = { name: "Command Author", field: false }
              translations.mentionedChannel = { name: "Mentioned User", field: false }
              if (actionType == 'message') {
                translations.user = { name: "Message Author", field: false }
              }
            }
          } else if (actionType == 'slash') {
            translations.command = { name: "Command Channel", field: false }

            if (!element.excludeUsers) {
              translations.commandAuthor = { name: "Command Author", field: false }
            }
          } else if (actionType == 'user') {
            if (!element.excludeUsers) {
              translations.commandAuthor = { name: "Command Author", field: false }
              translations.user = { name: "Command User", field: false }
            }
          }

          translations.id = { name: "Channel ID", field: true }

          if (!element.excludeUsers) {
            translations.userID = { name: "User ID", field: true }
          }

          if (element.also) {
            for (let o in element.also) {
              let also = element.also[o];
              translations[o] = { name: also, field: true }
            }
          }

          if (element.and) {
            for (let o in element.and) {
              if (translations[o]) {
                let and = element.and[o];
                translations[o].field = and;
              }
            }
          }

          if (element.additionalOptions) {
            translations = {
              ...element.additionalOptions,
              ...translations
            }
          }

          translations.tempVar = { name: "Temporary Variable", field: true }
          translations.serverVar = { name: "Server Variable", field: true }
          translations.globVar = { name: "Global Variable", field: true }

          if (!action.data[element.storeAs]) {
            if (element.optional) {
              action.data[element.storeAs] = {
                type: "none",
                value: ""
              }
            } else {
              let type = 'id';

              if (actionType == 'text' || actionType == 'slash' || actionType == 'message') {
                type = 'command'
              }

              action.data[element.storeAs] = {
                type,
                value: ""
              }
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            if (element.optional) {
              action.data[element.storeAs].type = 'none'
            } else {
              action.data[element.storeAs].type = 'id'
            }
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Channel')
        }

        if (element.element == 'image' || element.element == 'imageInput') {
          let translations = {
            none: { name: "None", field: false },
            file: { name: "File", field: true },
            url: { name: "URL", field: true },
          }

          if (!action.data[element.storeAs]) {
            if (element.optional) {
              action.data[element.storeAs] = { type: 'none', value: '' }
            } else {
              action.data[element.storeAs] = { type: 'file', value: '' }
            }
          }

          if (element.also) {
            for (let o in element.also) {
              let also = element.also[o];
              translations[o] = { name: also, field: true }
            }
          }

          if (element.and) {
            for (let o in element.and) {
              if (translations[o]) {
                let and = element.and[o];
                translations[o].field = and;
              }
            }
          }

          if (element.additionalOptions) {
            translations = {
              ...element.additionalOptions,
              ...translations
            }
          }

          translations = {
            ...translations,
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }

          if (!translations[action.data[element.storeAs].type]) {
            if (element.optional) {
              action.data[element.storeAs].type = 'none'
            } else {
              action.data[element.storeAs].type = 'file'
            }
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Image')
        }

        if (element.element == 'actions') {
          pendingActions.push(element);
          if (action.data[element.storeAs] == undefined || (typeof action.data[element.storeAs] == 'object' && !Array.isArray(action.data[element.storeAs]))) {
            action.data[element.storeAs] = [];
          }

          endHTML = `${endHTML}          
          </div>
            <div class="menuBar flexbox rounded_top dimension">
            <btext style="margin-left: 12px;">${element.name}</btext>
            <btn class="addButton dimension flexbox" onclick="createAction('${element.storeAs}')">
            <div id="${element.storeAs}AddButton"  class="image add" style="width: 23px; height: 23px;"></div>
            </btn>
            </div>
            <div onmouseover="lastHoveredContainer = '${element.storeAs}';" id="${element.storeAs}" onmouseenter="lastActionContainer = '${element.storeAs}'" onmouseleave="lastActionContainer = undefined; lastHoveredContainer = undefined;"
            style="transition: all 0.23s ease; margin: auto; width: var(--width-in-editor); height: ${element.large ? '400px' : '210px'}; transition: all 0.${editorSettings.commonAnimation}s ease;" class="dimension largeBox listContainer rounded_bottom">
            </div>`;
        }

        if (element.element == 'menu') {
          if (action.data[element.storeAs] == undefined) {
            action.data[element.storeAs] = [];
            if (element.required) {
              action.data[element.storeAs].push({
                type: Object.keys(element.UItypes)[0],
                data: undefined
              })
            }
          }

          if (element.max == 1) {
            endHTML += `
              <div class="flexbox" style="transition: all 0.2s ease; margin-bottom: 0px;" onmouseleave="lastHoveredContainer = undefined;"
              onmouseover="lastHoveredContainer = '${element.storeAs}';">
                <div class="menuBar flexbox dimension" style="margin-bottom: 0px;">
                  <div id="${element.storeAs}" style="${element.required ? 'width: 100%;' : 'width: 94%'};"></div>

                  <btn id="addButtonOf${index}" class="addButton dimension flexbox" style="${element.required ? 'display: none' : ''}" onclick="addObjectToCustomMenu('${index}')">
                    <div id="${index}AddButton" class="image add" style="width: 23px; height: 23px;"></div>
                  </btn>
                </div>
              </div>
              `
          } else {
            endHTML = `${endHTML}
              <div class="flexbox" style="transition: all 0.2s ease; margin-top: 2px;">
              <div class="menuBar flexbox rounded_top dimension">
              <btext style="margin-left: 12px;">${element.name}</btext>
              <btn class="addButton dimension flexbox" onclick="addObjectToCustomMenu('${index}')">
              <div id="${index}AddButton"  class="image add" style="width: 23px; height: 23px;"></div>
              </btn>
              </div>
              </div>
                <div onmouseover="lastHoveredContainer = '${element.storeAs}';"
                onmouseleave="lastHoveredContainer = undefined;"
                id="${element.storeAs}"
                style="transition: all 0.${editorSettings.commonAnimation}s ease; height: ${action.data[element.storeAs].length != 0 ? "170" : "38"}px;"
                class="dimension rounded_bottom largeBox ${element.collapsible ? "closedMenu" : ""} listContainer">
              </div>
              </div>
              `;
          }

          pendingMenus.push(index);
        }

        if (element.element == 'text') {
          endHTML += `<text>${element.text}</text>`
        }

        if (element.element == 'case' || element.element == 'condition') {
          if (action.data[element.storeAs] == undefined) {
            action.data[element.storeAs] = {
              type: 'continue',
              value: ''
            }
            action.data[element.storeActionsAs] = []
          }

          let translations = {
            continue: { name: "Continue Actions", field: false },
            stop: { name: "Stop Actions", field: false },
            runActions: { name: "Run Actions", field: false },
            skip: { name: "Skip # Actions", field: true },
            jump: { name: "Jump To Action #", field: true },
            anchorJump: { name: "Jump To Anchor", field: true },
            callAnchor: { name: "Call Anchor", field: true },
          }
          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, '', 'toggleDropdownContainer')

          pendingActions.push({ storeAs: element.storeActionsAs });
          endHTML += `
              <div class="menuBar flexbox dimension ${action.data[element.storeAs].type == 'runActions' ? "" : "closedActions"}" style="border-radius: var(--round-off); transition: all 0.${editorSettings.commonAnimation}s ease;">
              <btext style="margin-left: 12px;">Actions</btext>
              <btn class="addButton dimension flexbox" onclick="createAction('${element.storeActionsAs}')">
              <div id="${element.storeActionsAs}AddButton"  class="image add" style="width: 23px; height: 23px;"></div>
              </btn>
              </div>
              <div onmouseover="lastHoveredContainer = '${element.storeActionsAs}';" id="${element.storeActionsAs}" onmouseenter="lastActionContainer = '${element.storeActionsAs}'" onmouseleave="lastActionContainer = undefined; lastHoveredContainer = undefined;" class="dimension largeBox listContainer rounded_bottom ${action.data[element.storeAs].type == 'runActions' ? "" : "closedActions"}">
              </div>
            `
        }

        if (element.element == 'variableInsertion' || element.element == 'var' || element.element == 'variable') {
          let translations = {
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }

          if (element.optional) {
            translations.none = { name: "None", field: false }
          }

          if (element.also) {
            for (let o in element.also) {
              let also = element.also[o];
              translations[o] = { name: also, field: true }
            }
          }

          if (element.and) {
            for (let o in element.and) {
              let and = element.and[o];
              translations[o].field = and;
            }
          }

          if (element.additionalOptions) {
            translations = {
              ...element.additionalOptions,
              ...translations
            }
          }

          if (!action.data[element.storeAs]) {
            if (element.optional) {
              action.data[element.storeAs] = { type: "none", value: "" }
            } else {
              action.data[element.storeAs] = { type: 'tempVar', value: '' }
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            if (element.optional) {
              action.data[element.storeAs].type = 'none'
            } else {
              action.data[element.storeAs].type = 'tempVar'
            }
          }


          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Variable')
        }

        if (element.element == 'interaction') {
          let translations = {}

          if (actionType == 'slash' || actionType == 'message' || actionType == 'user') {
            translations.commandInteraction = { name: "Command Interaction", field: false };
          }

          if (!action.data[element.storeAs]) {
            if (actionType == 'slash' || actionType == 'message' || actionType == 'user') {
              action.data[element.storeAs] = { type: "commandInteraction", value: "" }
            } else {
              action.data[element.storeAs] = { type: "tempVar", value: "" }
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            action.data[element.storeAs].type = 'tempVar'
          }

          translations = {
            ...translations,
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }


          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Interaction')
        }

        if (element.element == 'message' || element.element == 'messageDropdown') {
          let translations = {};
          if (element.optional) {
            translations.none = { name: "None", field: false }
          }

          translations = {
            ...translations,
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }

          if (actionType == 'text' || actionType == 'message') {
            translations.commandMessage = { name: "Command Message", field: false }
          } else if (actionType == 'slash') {
            translations.interactionReply = { name: "Command Reply", field: false }
          }

          if (!action.data[element.storeAs]) {
            if (element.optional) {
              action.data[element.storeAs] = { type: 'none', value: "" }
            } else if (actionType == 'text' || actionType == 'message') {
              action.data[element.storeAs] = { type: "commandMessage", value: "" }
            } else if (actionType == 'slash') {
              action.data[element.storeAs] = { type: "interactionReply", value: "" }
            } else {
              action.data[element.storeAs] = { type: "tempVar", value: "" }
            }
          }

          if (!translations[action.data[element.storeAs].type]) {
            action.data[element.storeAs].type = element.optional ? 'none' : 'tempVar'
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Message')
        }

        if (element.element == 'role' || element.element == 'roleInput') {
          let translations = {
            id: { name: "ID", field: true },
          }

          if (actionType == 'text' || actionType == 'message') {
            translations.mentioned = { name: "Mentioned Role", field: false }
          }

          if (!action.data[element.storeAs]) {
            action.data[element.storeAs] = { type: "id", value: "" }
          }

          if (!translations[action.data[element.storeAs].type]) {
            action.data[element.storeAs].type = 'tempVar'
          }

          translations = {
            ...translations,
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, 'Role')
        }

        if (element.element == 'html') {
          endHTML += element.html
        }

        if (element.element == 'category' || element.element == 'guild') {
          let translations = {
            id: { name: "ID", field: true }
          }

          if (element.element == 'guild') {
            translations.current = { name: "Current", field: false }
          }


          if (element.optional) {
            translations.none = { name: "None", field: false }
          }

          if (!action.data[element.storeAs]) {
            if (!element.optional) {
              if (translations.current) {
                action.data[element.storeAs] = { type: "current", value: "" }
              } else {
                action.data[element.storeAs] = { type: "id", value: "" }
              }
            } else {
              action.data[element.storeAs] = { type: "none", value: "" }
            }
          }

          translations = {
            ...translations,
            tempVar: { name: "Temporary Variable", field: true },
            serverVar: { name: "Server Variable", field: true },
            globVar: { name: "Global Variable", field: true }
          }

          if (!translations[action.data[element.storeAs].type]) {
            if (!element.optional) {
              action.data[element.storeAs].type = 'tempVar'
            } else {
              action.data[element.storeAs].type = 'none'
            }
          }

          let hasField = translations[action.data[element.storeAs].type].field;

          endHTML += createDropdown(element, hasField, translations, index, element.element == 'category' ? "Category" : "Server")
        }
      } catch (err) { console.log(err) }
    }
  }

  if (options?.returnInstead) {
    return endHTML
  }

  try {
    return endHTML + "<div style='margin-top: 7px; display: block;'></div>";
  } finally {
    setTimeout(() => {
      for (let menu in pendingMenus) {
        refreshMenuItems(pendingMenus[menu], true);
      }
      for (let action in pendingActions) {
        refreshActions(pendingActions[action].storeAs);
      }

      if (actionFile.script && !excludeScript) {
        actionFile.script({
          data: action.data,
          type: actionType,
          UI: actionUI,
          document: document,
          events: actionEvents,
          extra: globalData || null,
          updateUI: refreshUI
        })

        emitChange(null);
      }
    }, 15);
  }
}