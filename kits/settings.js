let settingsFS = require('fs');
const appID = Number('2592170');

let path = 'C:/ProgramData/Bot-Maker-For-Discord'

if (require('os').platform == 'linux') {
  path = './linux-data'
}
if (require('os').platform == 'darwin') {
  path = './mac-data'
}

let ownSettings = { theme: "default", translation: "default" };
try {
  ownSettings = JSON.parse(
    settingsFS.readFileSync(path + "/EditorSettings.json", "utf8"),
  );
} catch (err) {
  console.log(err);
}

let editorSettings = {
  deletionScreening: true,
  focus: ownSettings.focus == 'On' ? true : false,
};

switch (ownSettings.bigBrain) {
  case 'On':
    var sheet = document.styleSheets[1];
    sheet.insertRule(":root{--smallBrainDisplay: none}");
    editorSettings.bigBrain = true;
    break
  default:
    var sheet = document.styleSheets[1];
    editorSettings.bigBrain = false;
    sheet.insertRule(":root{--bigBrainDisplay: none}");
    break
}

switch (ownSettings.preffered) {
  default:
    editorSettings.groupPaneHeight = "inherit";
    editorSettings.actionPaneHeight = "inherit";
    break;
  case "Group Pane":
    editorSettings.actionPaneHeight = "calc(35.5vh - 12px)";
    editorSettings.groupPaneHeight = "calc(44.5vh - 12px)";
    break;
  case "Action Pane":
    editorSettings.groupPaneHeight = "calc(35vh - 12px)";
    editorSettings.actionPaneHeight = "calc(45vh - 12px)";
    break;
}
switch (ownSettings.actionPreviewPosition) {
  default:
    editorSettings.subtitlePosition = "center";
    break;
  case "Right":
    editorSettings.subtitlePosition = "right";
    break;
  case "Left":
    editorSettings.subtitlePosition = "left";
    break;
}
switch (ownSettings.animations) {
  case "Slow":
    editorSettings.commonAnimation = 6;
    editorSettings.fastAnimation = 4;
    editorSettings.reallyFast = 1;
    break;
  case "Relaxed":
    editorSettings.commonAnimation = 4;
    editorSettings.fastAnimation = 3;
    editorSettings.reallyFast = 0.5;
    break;
  case "Fast":
    editorSettings.commonAnimation = 2;
    editorSettings.fastAnimation = 1;
    editorSettings.reallyFast = 0.01;
    break;
  case "Off":
    editorSettings.commonAnimation = 0;
    editorSettings.fastAnimation = 0;
    editorSettings.reallyFast = 0;
    break;
  default:
    editorSettings.commonAnimation = 3;
    editorSettings.fastAnimation = 2;
    editorSettings.reallyFast = 0.16;
    break;
}
var sheet = document.styleSheets[0];
sheet.insertRule(`:root{--commonAnimation: 0.${editorSettings.commonAnimation}s}`);
sheet.insertRule(`:root{--fastAnimation: 0.${editorSettings.fastAnimation}s}`);
sheet.insertRule(`:root{--reallyFast: ${editorSettings.reallyFast}s}`);


switch (ownSettings.scaleEffects) {
  case '1.2':
    var sheet = document.styleSheets[0];
    sheet.insertRule(":root{--scale: 1.1}");
    break

  case '0.8':
    var sheet = document.styleSheets[0];
    sheet.insertRule(":root{--scale: 0.95}");
    break
}

switch (ownSettings.varStyle) {
  case "Floating Window":
    editorSettings.oldVariableInsertion = true;
}

switch (ownSettings.scrolling) {
  default:
    var sheet = document.styleSheets[0];
    window.addEventListener("mousedown", function (event) {
      if (event.button === 1) {
        event.preventDefault();
      }
    });
    sheet.insertRule(":root{--scrollbar: hidden}");
    sheet.insertRule(":root{--scrw: 0px}");
    break

  case "On":
    var sheet = document.styleSheets[document.styleSheets.length - 1];
    sheet.insertRule(":root{--scrollbar: overlay}");
    sheet.insertRule(":root{--scrw: 7px}");
    break
}

switch (ownSettings.pointer) {
  default:
    var sheet = document.styleSheets[0];
    sheet.insertRule(":root{--pointer: pointer}");
    break

  case 'Arrow':
    var sheet = document.styleSheets[0];
    sheet.insertRule(":root{--pointer: default}");
    break
}

switch (ownSettings.deletionScreening) {
  default:
    editorSettings.actionDeletionScreening = true;
    editorSettings.commandDeletionScreening = true;
    break

  case 'Off':
    break

  case 'Commands Only':
    editorSettings.commandDeletionScreening = true;
    break

  case 'Actions Only':
    editorSettings.actionDeletionScreening = true;
    break
}

switch (ownSettings.actionButtons) {
  case "Left":
    editorSettings.leftActionPlacement = false;
    break;
  default:
    editorSettings.leftActionPlacement = true;
    break
}


switch (ownSettings.editOnCreation) {
  case "Just Actions":
    editorSettings.editActionsOnCreation = true;
    break;
  case "Just Menus":
    editorSettings.editMenusOnCreation = true;
    break;
  case "On":
    editorSettings.editMenusOnCreation = true;
    editorSettings.editActionsOnCreation = true;
    break;
}

editorSettings.animation = ownSettings.windowAnimation

if (ownSettings.theme == undefined) {
  ownSettings.theme = 'default';
}

// window.addEventListener('keydown', function(event) {
//   if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '-')) {
//     event.preventDefault();
//   }
// });


/**
 * @type {{ button: (options: any) => string; toggle: (options: any, onclick: any) => string; toggleSwitch: (element: HTMLDivElement) => void; }}
 */
let studioUI = {
  toggle: (options, onclick) => {
    return `
    <div class="toggle ${(Boolean(options.state) && ownSettings.highlightToggles == 'On') ? "selected " : ""}" id="${options.id}" data-state="${options.state}" onclick="studioUI.toggleSwitch(this); ${onclick}" style="${options.style || ""}">
    <btext style="margin-left: 11.5px;">${options.name}</btext>
    <secondaryText style="margin-top: auto; margin-bottom: auto; opacity: 50%;">${options.false ? options.false : "No"}</secondaryText>
    <div class="toggle_bar"><div class="toggle_tail ${options.state != true ? "toggle_button_true_pre toggle_button_true" : "toggle_button_false_pre toggle_button_false"}" style="transition: all 0.${editorSettings.fastAnimation}s ease;"></div></div>
    <secondaryText style="margin-right: 10px; margin-left: 0px !important; opacity: 50%; margin-top: auto; margin-bottom: auto;">${options.true ? options.true : "Yes"}</secondaryText>
    </div>
    `
  },


  toggleSwitch: (element) => {
    let toggle = element.getElementsByClassName('toggle_bar')[0].getElementsByClassName('toggle_tail')[0]
    toggle.style.transition = `all 0.${editorSettings.commonAnimation}s ease`;
    toggle.parentElement.style.transition = `all 0.${editorSettings.commonAnimation}s ease`;

    if (element.dataset.state == 'false') {
      element.dataset.state = 'true'
      
      if (ownSettings.highlightToggles == 'On') {
        element.classList.add('selected')
      }

      toggle.classList.add('toggle_button_animation_false_to_true');
      toggle.classList.add('toggle_button_false_pre');
      toggle.classList.remove('toggle_button_true_pre');
      toggle.classList.remove('toggle_button_true');
      toggle.parentElement.classList.add('toggle_tail_animation_true_to_false');

      setTimeout(() => {
        toggle.classList.remove('toggle_button_animation_false_to_true');
        toggle.parentElement.classList.remove('toggle_tail_animation_true_to_false');
        toggle.classList.add('toggle_button_false');
      }, editorSettings.commonAnimation * 50);

    } else {
      element.dataset.state = 'false'

      toggle.classList.remove('toggle_button_false_pre');
      toggle.classList.remove('toggle_button_false');
      toggle.classList.add('toggle_button_true_pre');
      toggle.parentElement.classList.add('toggle_tail_animation_false_to_true');
      element.classList.remove('selected');

      toggle.classList.add('toggle_button_animation_true_to_false');

      setTimeout(() => {
        toggle.classList.remove('toggle_button_animation_true_to_false');
        toggle.classList.add('toggle_button_true');
        toggle.parentElement.classList.remove('toggle_tail_animation_false_to_true');
      }, editorSettings.commonAnimation * 50);
    }
  },

  dropdown: (options) => {
    let choices = options.options;
    let foundChoice;
    choices.forEach(choice => {
      if (choice.value == options.currentChoice) {
        foundChoice = choice;
      }
    });

    if (!foundChoice) {
      foundChoice = choices[0];
    }

    return `<div id="${options.id}" class="flexbox" data-options='${JSON.stringify(choices)}' data-chosen="${foundChoice.value}" style='${options.style || ""}; margin-left: auto; margin-right: auto; ${!options.forcePush ? 'height: 30.8px' : ""};'>
    <div onclick="studioUI.openDropdown(this, () => {${options.onclick}})" class="dropdown" style="width: 100%; display: block; font-size: 20px; margin-left: auto; margin-right: auto; padding-right: 0px; padding-left: 12px; transition: all 0.3s ease;">${foundChoice.name}</div>
    </div>`
  },

  openDropdown: (element, bound) => {
    element.style.zIndex = '1000'
    element.parentElement.style.zIndex = '1000'

    element.onclick = () => {
      studioUI.closeTypedDropdown(element, bound)
    }

    let types = JSON.parse(element.parentElement.dataset.options)

    for (let translation of types) {
      if (translation.value != element.parentElement.dataset.chosen) {
        let option = document.createElement('div')
        option.style = ''
        option.className = 'dropdown_option'
        option.onclick = () => {
          studioUI.selectDropdownOption(element, bound, translation);
        }
        option.innerHTML = translation.name;
        element.appendChild(option);
      }
    }
  },

  selectDropdownOption: (element, bound, translation) => {
    element.parentElement.dataset.chosen = translation.value;

    bound();
  },

  closeTypedDropdown: (element, bound) => {
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
        studioUI.openDropdown(element, bound)
      };
      element.innerHTML = JSON.parse(element.parentElement.dataset.options).find(opt => opt.value == element.parentElement.dataset.chosen).name;
    }, 70);
  },

  getColors: () => {
    return ["rgb(255, 255, 255)", "rgb(255, 0, 0)", "rgb(255, 106, 0)", "rgb(255, 200, 0)", "rgb(187, 255, 0)", "rgb(51, 255, 0)", "rgb(0, 255, 213)", "rgb(0, 132, 255)", "rgb(0, 90, 255)", "rgb(72, 0, 255)", "rgb(119, 0, 255)", "rgb(195, 0, 255)", "rgb(255, 0, 225)"]
  },

  colorPicker: (style, onclick, rgb, realStyle) => {
    return `
    <div data-r="${rgb.r}" data-g="${rgb.g}" data-b="${rgb.b}" style="${realStyle}">
    <div class="flexbox" style="width: 33px; overflow: hidden; height: 33px; margin: auto; transition: all var(--commonAnimation) var(--ease-strong);" onclick="studioUI.togglePicker(this)">
    <btn class="flexbox" style="width: 33px; height: 33px; padding: 0px; margin: auto; ${style || ""}">
      <div class="image editAction"></div>
    </btn>

    ${studioUI.getColors().map((color) => {
      return `<div class="palette" style="background: ${color};" onclick="this.parentElement.dataset.r = ${color.replaceAll('rgb(', '').replaceAll(')', '').split(', ')[0]}; this.parentElement.dataset.g = ${color.replaceAll('rgb(', '').replaceAll(')', '').split(', ')[1]}; this.parentElement.dataset.b = ${color.replaceAll('rgb(', '').replaceAll(')', '').split(', ')[2]}; ${onclick}"></div>`
    }).join('')}
    </div>
    `
  },

  colorSlider: (options, style) => {
    return `
    <input type="range" onchange="${options.onclick[1]}" style="--chosenColor: hsl(${options.hsl}, 100%, ${options.brightness}); ${style[0]}" class="slider" value="${options.hsl}" step="0.001" max="360" min="0" oninput="studioUI.colorChange(this); ${options.onclick[0]}">
    ${options.inbetween || ""}
    <input type="range" onchange="${options.onclick[2]}" style="--chosenColor: rgb(${opposite(options.brightness) * 255}, ${opposite(options.brightness) * 255}, ${opposite(options.brightness) * 255}); ${style[1]}" class="slider bw" value="${options.brightness}" step="0.001" max="1" min="0" oninput="studioUI.colorChange(this.previousElementSibling); this.previousElementSibling.oninput(); this.previousElementSibling.onchange();">
    `
  },


  colorChange: (slider) => {
    var val = slider.value;
    var val2 = slider.nextElementSibling.value;
    slider.style.setProperty('--chosenColor', `hsl(${val}, 100%, ${val2 * 100}%)`)
    slider.nextElementSibling.style.setProperty('--chosenColor', `rgb(${opposite(val2) * 255}, ${opposite(val2) * 255}, ${opposite(val2) * 255})`)
  },

  togglePicker: (element) => {
    let sibling = element;
    if (sibling.style.width == '33px') {
      sibling.style.width = '518.4px'
      setTimeout(() => {
        sibling.style.overflow = 'visible'
      }, editorSettings.commonAnimation * 100);
    } else {
      sibling.style.width = '33px'
      sibling.style.overflow = 'hidden'
    }
  },

  colorPickerToggle: (id, constant) => {
    document.getElementById(`${constant}red`).style.width = '0%'
    document.getElementById(`${constant}red`).style.opacity = '0%'
    document.getElementById(`${constant}red`).style.height = '0px'
    document.getElementById(`${constant}green`).style.width = '0%'
    document.getElementById(`${constant}green`).style.opacity = '0%'
    document.getElementById(`${constant}green`).style.height = '0px'
    document.getElementById(`${constant}blue`).style.width = '0%'
    document.getElementById(`${constant}blue`).style.opacity = '0%'
    document.getElementById(`${constant}blue`).style.height = '0px'

    setTimeout(() => {
      if (resolvedToggles[constant] != id) {
        document.getElementById(id).style.width = '100%'
        document.getElementById(id).style.opacity = '1'
        document.getElementById(id).style.height = '30px'
        resolvedToggles[constant] = id;
      } else {
        resolvedToggles[constant] = undefined;
      }
    }, resolvedToggles[constant] ? editorSettings.commonAnimation * 100 : 1);
  },
}

function opposite(number) {
  return (-number) + 1;
}



let resolvedToggles = {};

async function awaitIPCResponse(send, receive) {
  return new Promise(resolve => {
    ipcRenderer.send(send.channel, send.content);

    ipcRenderer.once(receive, (event, data) => {
      resolve(data)
    })
  })
}

let keybindOverwrites = {}


if (ownSettings.keybindOverwrites) {
  for (let key in ownSettings.keybindOverwrites) {
    let kbd = ownSettings.keybindOverwrites[key];
    keybindOverwrites[key] = kbd;
  }
}

let keybinds = {
  save: { display: `CTRL+${(keybindOverwrites.save || "s").toUpperCase()}`, key: (keybindOverwrites.save || "s") },
  save_exit: { display: `CTRL+${(keybindOverwrites.save_exit || "q").toUpperCase()}`, key: (keybindOverwrites.save_exit || "q") },
  search: { display: `CTRL+${(keybindOverwrites.search || "k").toUpperCase()}`, key: (keybindOverwrites.search || "k") },
  done: { display: `CTRL+${(keybindOverwrites.done || "q").toUpperCase()}`, key: (keybindOverwrites.done || "q") },
  create: { display: `CTRL+${(keybindOverwrites.create || "d").toUpperCase()}`, key: (keybindOverwrites.create || "d") },
  toggle: { display: `CTRL+${(keybindOverwrites.resize || "`").toUpperCase()}`, key: (keybindOverwrites.resize || "`") },
  toggleState: { display: `CTRL+${(keybindOverwrites.resize || "`").toUpperCase()}`, key: (keybindOverwrites.resize || "`") },
  newAction: { display: `CTRL+${(keybindOverwrites.newAction || "n").toUpperCase()}`, key: (keybindOverwrites.resize || "n") },
  newCommand: { display: `CTRL+${(keybindOverwrites.newCommand || "j").toUpperCase()}`, key: (keybindOverwrites.resize || "j") },
  exit: { display: `CTRL+TAB`, key: "tab" },
  modifier: "ctrlKey",
  modifier_readable: "CTRL",
}

const keybindElements = {
  'keybind-save': keybinds.save.display,
  'keybind-save-exit': keybinds.save_exit.display,
  'keybind-exit': keybinds.exit.display,
  'keybind-search': keybinds.search.display,
  'keybind-done': keybinds.done.display,
  'keybind-create': keybinds.create.display
};

for (const [className, displayText] of Object.entries(keybindElements)) {
  for (const element of document.getElementsByClassName(className)) {
    element.innerHTML = displayText;
  }
}


try {
  var datjson = JSON.parse(settingsFS.readFileSync("./AppData/data.json"));
} catch (error) {
  var datjson = {}
}
function finishEverything(cb) {
  if (ownSettings.theme == 'default' || ownSettings.theme == undefined) {
    document.getElementById("everything_container").style.background = `linear-gradient(130deg, ${ownSettings.firstColor || `rgb(0, 0, 0)`}, ${ownSettings.secondColor || `rgb(18, 18, 18)`})`;
  } else {
    document.getElementById("everything_container").style.background = `var(--window-background)`;
    try {
      document.getElementById('everything_container_2').style.backgroundColor = 'unset'
    } catch (error) { }
  }

  let easingFunction = 'ease'

  if (editorSettings.animation == 'Push' || !editorSettings.animation) {
    document.getElementById("everything_container").style.transform = "rotate3d(12, 0, 0, -90deg)";
    document.getElementById("everything_container").style.scale = "0";
    // easingFunction = 'ease-in-out'
  } else if (editorSettings.animation == 'Simple') {
    document.getElementById("everything_container").style.scale = "1";
    document.getElementById("everything_container").style.opacity = "0";
    document.getElementById("everything_container").style.filter = "blur(0px)";
  }


  setTimeout(() => {
    document.body.style.transition = `all 0.${editorSettings.commonAnimation}s ${easingFunction}`;
    document.body.style.backgroundColor = "#FFFFFF00";
    document.getElementById("everything_container").style.transition = `all 0.${editorSettings.commonAnimation}s ${easingFunction}`;
    document.getElementById("everything_container").style.transform = "rotate3d(12, 0, 0, 0deg)";
    document.getElementById("everything_container").style.scale = "1";
    document.getElementById("everything_container").style.opacity = "1";
    document.getElementById("everything_container").style.filter = "blur(0px)";
    if (cb) {
      setTimeout(() => {
        cb()
      }, editorSettings.commonAnimation * 100);
    }
  }, 20);
}

async function unfinishEverything(callback) {
  if (editorSettings.animation == 'Simple') {
    document.getElementById("everything_container").style.opacity = "0";
  } else if (editorSettings.animation == 'Expand') {
    document.getElementById("everything_container").style.scale = "0";
    document.getElementById("everything_container").style.filter = "blur(40px)";
  } else {
    document.getElementById("everything_container").style.transform = "rotate3d(100, 0, 0, 90deg)";
    document.getElementById("everything_container").style.scale = "0";
    document.getElementById("everything_container").style.filter = "blur(40px)";
  }

  setTimeout(() => {
    callback();
  }, editorSettings.commonAnimation * 100);
}

try {
  let themeCss = settingsFS.readFileSync(`./Themes/${ownSettings.theme}/theme.css`, 'utf8');

  let styleSheet = document.createElement('style');
  styleSheet.id = 'theme_container';
  styleSheet.innerHTML = themeCss;
  document.body.appendChild(styleSheet);
} catch (error) {
  let styleSheet = document.createElement('style');
  styleSheet.id = 'theme_container';
  styleSheet.innerHTML = '';
  document.body.appendChild(styleSheet);
}


let cachedStrings;

function getStrings() {
  try {
    if (cachedStrings) return cachedStrings;
    let result;
    let strings = require(`${process.cwd()}/cachedStrings.json`);
    cachedStrings = strings;
    return result;
  } catch (error) { }
}
getStrings()


function getString(string, replacements) {
  for (let i in replacements) {
    string = string.replace(`+${Number(i) + 1}`, replacements[i])
  }

  return string;
}

function dismissContent(content) {
  if (!settingsFS.existsSync('./Dismissed Content')) {
    settingsFS.mkdirSync('./Dismissed Content')
  }

  settingsFS.writeFileSync(`./Dismissed Content/${content}`, '1')
}
function isDismissed(content) {
  return settingsFS.existsSync(`./Dismissed Content/${content}`, () => { })
}

function clipboardCopy(toCopy) {
  navigator.clipboard.writeText(toCopy)
}

function updateTopBarContent(updated, specifity) {
  let element = specifity ? document.getElementById(specifity) : document.getElementsByClassName('editor_toolbar')[0].getElementsByTagName('btext')[0]
  element.style.transition = `all 0.${editorSettings.commonAnimation}s cubic-bezier(.47,.75,.36,1.54), blur ease var(--commonAnimation), var(--ease-strong) var(--commonAnimation)`

  setTimeout(() => {
    element.style.scale = '0.7';
    element.style.opacity = '0';
    element.style.filter = 'blur(12px)';
    setTimeout(() => {
      element.innerHTML = updated;
    }, editorSettings.commonAnimation * 100);
    setTimeout(() => {
      element.style.scale = '1';
      element.style.opacity = '1';
      element.style.filter = '';
    }, editorSettings.commonAnimation * 110);
  }, 10);
}

var processPath = require('process').cwd();

if (datjson.structureType != '1') {
  processPath = processPath + `/Legacy`;
}

for (let i in document.getElementsByTagName('translation')) {
  let element = document.getElementsByTagName('translation')[i];
  element.innerHTML = eval(`cachedStrings.${element.id}`);
}

const hexToRGB = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHEX(rgb) {
  let rgbSeparated = rgb.replaceAll('rgb(', '').replaceAll(')', '').split(', ');
  let r = rgbSeparated[0];
  let g = rgbSeparated[1];
  let b = rgbSeparated[2];
  console.log(r, g, b, rgbSeparated)
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
