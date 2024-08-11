let kindOf;
let highlights = {};
let lastContainer;
let lastHoveredMenu;
let lastHovered;
let isHoldingCTRL = false;
let lastActionContainer;

let lastOpenedMenu = {}

let cancelMenu = false;

(Element.prototype.appendBefore = function (element) {
  element.parentNode.insertBefore(this, element);
}),
  false;
(Element.prototype.appendAfter = function (element) {
  element.parentNode.insertBefore(this, element.nextSibling);
}),
  false;

window.oncontextmenu = function (event) {
  if (menu) {
    menu.style.transition = "all 0.2s ease";
  }
  showCustomMenu(event.clientX, event.clientY);
  return false; // cancel default menu
};

async function addObjectToCustomMenu(element) {
  if (document.getElementById(actionUI[element].storeAs)?.getElementsByClassName('backArrow').length) {
    document.getElementById(actionUI[element].storeAs).getElementsByClassName('backArrow')[0].parentElement.style.opacity = '0'
  }

  if (document.getElementById(`addButtonOf${element}`)?.previousElementSibling.getElementsByClassName('backArrow').length) {
    document.getElementById(`addButtonOf${element}`).previousElementSibling.getElementsByClassName('backArrow')[0].parentElement.style.opacity = '0'
  }

  let targetField = document.getElementById(actionUI[element].storeAs);
  targetField.style.transition = `all 0.${editorSettings.fastAnimation}s ease`

  let animationDelay = 0

  if (actionUI[element].max > action.data[actionUI[element].storeAs].length) {
    if (Object.keys(actionUI[element].types).length > 1) {
      await new Promise(res => {
        action.data[actionUI[element].storeAs].forEach((e, index) => {
          try {
            document.getElementById(`menu${element}object${index}`).style.transition = `all 0.${editorSettings.fastAnimation}s ease`
            document.getElementById(`menu${element}object${index}`).style.opacity = '0'
          } catch (error) { }
        })

        setTimeout(() => {
          res()
        }, editorSettings.fastAnimation * 100);
      })
      document.getElementById(`${element}AddButton`).style.transition = `all 0.${editorSettings.commonAnimation}s ease`

      document.getElementById(`${element}AddButton`).style.transform =
        "rotate(135deg)";
      document.getElementById(`${element}AddButton`).parentElement.onclick = () => {
        refreshMenuItems(`${element}`, true);

        setTimeout(() => {
          targetField.classList.remove('flexbox');
        }, editorSettings.commonAnimation * 100);
      };

      let endHTML = "";
      for (let option in actionUI[element].types) {
        if (animationDelay != 9) {
          animationDelay++
        }
        endHTML = `${endHTML}
            <btn class="flexbox" style="padding: var(--average-tile-padding); margin: var(--bar-margin) !important;" onclick="addObjectToMenu('${element}', '${option}')">
            <btext>${actionUI[element].types[option]}</btext>
            </btn>
            `;
      }

      targetField.classList.add('flexbox')
      targetField.style.height = "170px";

      setTimeout(() => {
        targetField.innerHTML = `
          <div class="fade" id="${actionUI[element].storeAs}_Options" style="animation-duration: 0.${editorSettings.fastAnimation}s !important; transition: all 0.${editorSettings.fastAnimation}s ease; margin: auto;">
            <div class="buttontexta"> ${!editorSettings.focus ? `${actionUI[element].name} have different types, select one!` : `${actionUI[element].name} Types`}</div>
            <div class="flexbox" style="align-items: center; justify-content: center;">
            ${endHTML}
            </div>
          </div>
            `;
      }, editorSettings.fastAnimation * 100);
    } else {
      addObjectToMenu(`${element}`, Object.keys(actionUI[element].types)[0], true);
    }
  }
}

function deleteMenuOption(position, menu, skipAnimations) {
  action.data[actionUI[menu].storeAs].splice(position, 1);

  document.getElementById(`menu${menu}object${position}`).style.transition = `all 0.${editorSettings.commonAnimation}s ease`
  document.getElementById(`${menu}AddButton`).style.transition = `all 0.${editorSettings.commonAnimation}s ease`

  setTimeout(() => {
    refreshMenuItems(menu);
  }, editorSettings.commonAnimation * 100);

  setTimeout(() => {
    document.getElementById(`menu${menu}object${position}`).style.opacity = '0%'

    if (!skipAnimations) {
      document.getElementById(`menu${menu}object${position}`).style.height = '0px'
      document.getElementById(`menu${menu}object${position}`).style.paddingTop = '0px'
      document.getElementById(`menu${menu}object${position}`).style.paddingBottom = '0px'
      document.getElementById(`menu${menu}object${position}`).style.marginBottom = '0px'
      document.getElementById(`menu${menu}object${position}`).style.marginTop = '0px'
    }
  }, editorSettings.commonAnimation);
}

function fuzzyMatch(str, pattern, accuracy) {
  pattern = pattern.replace(/[-\\\/^$*+?.()|[\]{}]/g, "\\$&");
  pattern = pattern.split("").reduce((a, b) => a + `.*${b}`, "");

  const regex = new RegExp(pattern, "i");
  const matchScore = str.match(regex) ? str.match(regex)[0].length : 0;
  const requiredScore = str.length * accuracy;

  return matchScore >= requiredScore;
}

let folders;

async function viewAllActions() {
  let ind = -1;
  try {
    document.getElementById('searchResults').innerHTML = ''
    if (!folders) {
      folders = {};
      for (let action of cachedActions) {
        ind++
        if (!folders[action.category]) {
          folders[action.category] = ''
        }
        folders[action.category] += `
        <div class="hoverable dimension search_action searchResult${ind}" onclick="switchOutAction('${action.file}')" style="width: 94.5%;"><btext>${action.name}${action.mod ? ` <span style="font-size: 12px; opacity: 50%;">MOD</span>` : ""}</btext></div>
      `
      };

      folders = Object.fromEntries(Object.entries(folders).sort())
    }

    for (let f in folders) {
      let folder = folders[f];
      document.getElementById('searchResults').innerHTML += `
    <div onclick="openActionFolder(this)" class="hoverablez dimension fade search_action flexbox" style="animation-duration: 0.${editorSettings.commonAnimation}s;">
    <div class="image folder" style="margin-right: 10px; margin-left: 3px; width: 19px; height: 19px;"></div>
    <btext style="margin-right: auto; margin-left: 0px; margin-top: auto; margin-bottom: auto; transition: all 0.${editorSettings.fastAnimation}s ease;">${f}</btext></div>
    <div class="search_action" id="${f}_FOLDER_ACTION" style="background: var(--secondary-main); padding: 0px; width: calc(94% + 10px); height: 0px; transition: all 0.${editorSettings.fastAnimation}s ease;">
      ${folder}
    </div></div>`
    }
  } catch (err) { console.log(err) }
}

let isSearchOpen = false;
async function startSearch() {
  if (isSearchOpen) return;
  isSearchOpen = true;
  let cache;
  if (!Array.isArray(cachedActions)) {
    cache = new Promise(resolve => {
      ipcRenderer.send(`${time}`, {
        event: "askForCache"
      });

      ipcRenderer.on('actionCache', (e, actionCache) => {
        cachedActions = actionCache.cachedActions;
        resolve()
      })
    });
  }

  document.getElementById('searchIcon').style.transition = `all 0.${editorSettings.commonAnimation}s ease`;

  document.getElementById('searchIcon').style.rotate = '360deg';
  document.getElementById('searchIcon').style.scale = '0.6';

  setTimeout(() => {
    document.getElementById('searchIcon').style.scale = '1'
  }, editorSettings.commonAnimation * 30);

  await cache;
  document.getElementById('actionSearchButton').onclick = () => { closeSearch() }
  const container = document.getElementById('editorContent');
  container.style.transition = `all 0.${editorSettings.fastAnimation}s ease`;

  const search = document.getElementById('search');
  search.style.height = 'calc(100vh - var(--toolbar-height))'
  search.style.transition = `all 0.${editorSettings.fastAnimation}s ease, opacity 0.${editorSettings.commonAnimation == '0' ? '1' : '5'}s ease`
  search.style.opacity = '1'

  if (!document.getElementById('searchResults')) {
    search.innerHTML = `
      <div style="height: 100%; width: 296.475px">
      <input oninput="actionSearch(this.value)" style="margin-top: 5px; width: 97%; border-radius: var(--round-intense); transition: all 0.${editorSettings.commonAnimation}s ease;" placeholder="Search"></input>
      <div id="searchResults" style="overflow: auto !important; height: 92%; width: 296.475px; border-radius: var(--round-intense);"></div>
      </div>`
    viewAllActions();
  };

  container.style.borderRadius = 'var(--round-strong)'
  container.style.scale = '0.9'
  container.style.marginRight = '-296.475px';
  search.style.width = '296.475px';
  search.style.overflow = 'hidden';

  document.getElementById('search').firstElementChild.firstElementChild.focus();
}

function actionSearch(query) {
  cachedResults = undefined;
  if (query == "") {
    viewAllActions();
    return;
  }
  query = query.replaceAll(' ', '')

  let endFolders = {};
  let overwrittenFolders = {};
  let count = 0;

  document.getElementById("searchResults").innerHTML = "";
  for (let action in cachedActions) {
    if (fuzzyMatch(cachedActions[action].name, query, 0.02)) {
      count++
      if (!endFolders[cachedActions[action].category]) {
        endFolders[cachedActions[action].category] = ''
      }
      endFolders[cachedActions[action].category] += `
        <div class="hoverable dimension search_action fade searchResult${count}" onclick="switchOutAction('${cachedActions[action].file}')"><btext>${cachedActions[action].name}${cachedActions[action].mod ? ` <span style="font-size: 12px; opacity: 50%;">MOD</span>` : ""}</btext></div>`
    }
  }

  for (let folder in folders) {
    if (fuzzyMatch(folder, query, 0.02)) {
      overwrittenFolders[folder] = true;
      endFolders[folder] = folders[folder];
    }
  }

  endFolders = Object.fromEntries(Object.entries(endFolders).sort());

  let initialKeys = [];
  let leftoverKeys = [];
  for (let folder in endFolders) {
    if (overwrittenFolders[folder]) {
      initialKeys.push([folder, endFolders[folder]])
    } else {
      leftoverKeys.push([folder, endFolders[folder]])
    }
  }
  let endKeys = [...initialKeys, ...leftoverKeys]
  endFolders = Object.fromEntries(endKeys)

  for (let folderName in endFolders) {
    let decoration = ``
    if (overwrittenFolders[folderName]) {
      decoration = `
      <div class="image folder" style="height: 19px; width: 19px; margin-left: 8px; margin-right: 2px;"></div>
      <div style="z-index: 5000; border-radius: var(--round-normal); height: 12px; margin-top: -2px; padding-left: 0px; padding-bottom: 2px;">
      <div class="image searchIcon" style="width: 12px; height: 12px; margin-top: 1px; margin-right: 5px;"></div>
      </div>
      `
    } else {
      decoration = `
      <div class="image folder" style="margin-right: 5px; margin-left: 8px; width: 19px; height: 19px;"></div>
      `
    }

    document.getElementById("searchResults").innerHTML += `
      <div class="search_action dimension fade ${overwrittenFolders[folderName] ? "folder_from_search" : ""}" style="background: var(--secondary-main); padding: 0px; padding-top: 5px; width: calc(94% + 10px);">
      <div class="flexbox" style="margin-bottom: 5px;">
      ${decoration}
      <btext style="margin-right: auto; margin-left: 3px;">${folderName}</btext>
      </div>
      ${endFolders[folderName]}
      </div>
    `
  }
}

async function closeSearch() {
  searchResultSelected = 0;
  document.getElementById('searchIcon').style.rotate = '0deg'
  document.getElementById('searchIcon').style.scale = '0.6';

  setTimeout(() => {
    document.getElementById('searchIcon').style.scale = '1'
    isSearchOpen = false;
  }, editorSettings.commonAnimation * 30);

  document.getElementById('actionSearchButton').onclick = () => { startSearch() }

  const container = document.getElementById('editorContent');
  container.style.scale = '1'
  container.style.borderRadius = '0px'
  container.style.marginRight = '0';

  const search = document.getElementById('search');
  search.style.width = '0';
  search.style.opacity = '0'
}

function switchOutAction(file) {
  let newAction = require(`${processPath}/AppData/Actions/${file}`);
  actionFile = newAction;
  action.data = newAction.data;
  action.name = newAction.data.name;
  action.file = file;
  actionUI = newAction.UI;
  actions[actionNumber].data = action.data;
  document.getElementById("editorContent").innerHTML = "";
  document.getElementById("editorContent").innerHTML = getUIelements(newAction.UI);

  closeSearch();
  updateTopBarContent(`${action.name}`, 'action-name');

  recacheThisVariables();
}

function openHalfDropdown(storedAs, index) {
  document.getElementById(storedAs).onclick = () => {
    closeHalfDropdown(storedAs, index)
  }

  document.getElementById(storedAs).style.zIndex = '1000'
  document.getElementById(storedAs).parentElement.style.zIndex = '1000'

  for (let choiceIndex in actionUI[index].choices) {
    let choice = actionUI[index].choices[choiceIndex]
    if (choice.name != action.data[storedAs]) {
      document.getElementById(storedAs).innerHTML += `
      <div class="dropdown_option" onclick="setHalfDropdownType('${storedAs}', '${choiceIndex}', '${index}')" style="">${choice.name}</div>
      `
    }
  }
}

function setHalfDropdownType(storedAs, choice, index) {
  let foundChoice;
  for (let option of actionUI[index].choices) {
    if (option.name == action.data[actionUI[index].storeAs]) {
      foundChoice = option;
    }
  }
  if (foundChoice.placeholder) {
    document.getElementById(`${storedAs}input`).ariaPlaceholder = foundChoice.placeholder
  } else {
    document.getElementById(`${storedAs}input`).ariaPlaceholder = ''
  }

  let input = document.getElementById(`${storedAs}input`)

  if (foundChoice.field && !actionUI[index].choices[choice].field) {
    let dropdown = document.getElementById(storedAs)

    dropdown.parentElement.style.marginRight = '0'

    dropdown.classList.remove('borderright');
    dropdown.style.width = 'calc(var(--width-in-editor) - 12px)'

    input.style.width = '0px'
    input.style.setProperty('padding', '0px')
    input.style.height = '0px'
  } else if (!foundChoice.field && actionUI[index].choices[choice].field) {
    let dropdown = document.getElementById(storedAs)

    dropdown.parentElement.style.marginRight = 'var(--dropdown-paddingLeft)'

    dropdown.classList.add('borderright');
    dropdown.style.width = 'var(--width-in-otherhalf-dropdown)'

    input.style.width = 'calc(var(--width-in-editor) - var(--width-in-half-dropdown))'
    input.style.setProperty('padding', '')
    input.style.height = '30.8px'
  }

  input.placeholder = actionUI[index].choices[choice].placeholder ? actionUI[index].choices[choice].placeholder : ''

  action.data[storedAs] = actionUI[index].choices[choice].name;

  emitChange(storedAs)
}

function closeHalfDropdown(s, i) {
  let element = document.getElementById(s);
  element.style.animationName = "";
  const innerHeight = element.clientHeight;
  element.style.animationDuration = "";
  element.style.setProperty("--inner-height", innerHeight + "px");
  element.style.animationName = "shrink";
  element.style.animationDuration = "300ms";
  element.style.zIndex = ''
  element.parentElement.style.zIndex = ''


  setTimeout(() => {
    element.onclick = () => {
      openHalfDropdown(s, i)
    };
    element.innerHTML = action.data[s];
  }, 70);
}

function openTypedDropdown(storedAs, index, types, toRun) {
  document.getElementById(storedAs).style.zIndex = '1000'
  document.getElementById(storedAs).parentElement.style.zIndex = '1000'

  document.getElementById(storedAs).onclick = () => {
    closeTypedDropdown(storedAs, index, types, toRun)
  }

  for (let translation in types) {
    if (translation != action.data[storedAs].type) {
      let option = document.createElement('div')
      option.className = 'dropdown_option'
      option.onclick = () => {
        setTypedType(storedAs, { ...types[translation], type: translation }, index)
      }
      option.innerHTML = types[translation].name;
      document.getElementById(storedAs).appendChild(option)
    }
  }
}

function setTypedType(storedAs, translation, i, toRun) {
  if (!translation.field) {
    let dropdown = document.getElementById(storedAs)
    let input = document.getElementById(`${storedAs}input`)

    dropdown.parentElement.style.marginRight = '0'

    dropdown.classList.remove('borderright');
    dropdown.style.width = 'calc(var(--width-in-editor) - 12px)'

    input.style.width = '0px'
    input.style.setProperty('padding', '0px')
    input.style.height = '0px'
  } else {
    let dropdown = document.getElementById(storedAs)
    let input = document.getElementById(`${storedAs}input`)

    dropdown.parentElement.style.marginRight = 'var(--dropdown-paddingLeft)'

    dropdown.classList.add('borderright');
    dropdown.style.width = 'var(--width-in-otherhalf-dropdown)'

    input.style.width = 'calc(var(--width-in-editor) - var(--width-in-half-dropdown))'
    input.style.setProperty('padding', '')
    input.style.height = '30.8px'
  }

  action.data[storedAs].type = translation.type;
}

function closeTypedDropdown(s, i, types, toRun) {
  let element = document.getElementById(s);
  element.style.animationName = "";
  const innerHeight = element.clientHeight;
  element.style.animationDuration = "";
  element.style.setProperty("--inner-height", innerHeight + "px");
  element.style.animationName = "shrink";
  element.style.animationDuration = "300ms";
  element.style.zIndex = ''
  element.parentElement.style.zIndex = ''

  if (toRun) {
    toRun(action.data[s], i);
  }

  setTimeout(() => {
    element.onclick = () => {
      openTypedDropdown(s, i, types, toRun)
    };
    element.innerHTML = types[action.data[s].type].name;
  }, 70);
}

function openActionFolder(folder_bar) {
  let element = folder_bar.nextElementSibling;
  let heightGuesser = document.createElement('div');
  heightGuesser.innerHTML = element.innerHTML;
  heightGuesser.style.width = element.clientWidth;
  heightGuesser.classList.add('search_action');
  heightGuesser.style.padding = '0px'
  element.style.marginTop = '4px';
  document.body.appendChild(heightGuesser);
  setTimeout(() => {
    let height = heightGuesser.clientHeight;
    element.style.paddingTop = '4px';
    element.style.height = height;
    folder_bar.classList.add('rounded_top');
    element.classList.add('rounded_bottom');
    heightGuesser.remove();
  }, 10);

  folder_bar.onclick = () => {
    closeActionFolder(folder_bar)
  }
}

function toggleDropdownContainer(dataset, i) {
  let actionContainer = document.getElementById(actionUI[i].storeActionsAs);
  if (dataset.type == 'runActions') {
    actionContainer.classList.remove('closedActions');
    actionContainer.previousElementSibling.classList.remove('closedActions');
  } else {
    actionContainer.classList.add('closedActions');
    actionContainer.previousElementSibling.classList.add('closedActions');
  }
}

function closeActionFolder(folder_bar) {
  folder_bar.classList.remove('rounded_top');
  let element = folder_bar.nextElementSibling;
  element.classList.remove('rounded_bottom')
  element.style.height = '0px'
  element.style.paddingBottom = '0px';
  element.style.paddingTop = '0px';
  element.style.marginTop = '0px';
  folder_bar.onclick = () => {
    openActionFolder(folder_bar)
  }
}