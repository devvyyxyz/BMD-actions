var fs = require("fs");
let lastButton;
let menu;

function closeContextmenu() {
  if (menu && !mOpened) {
    menu.style.scale = "0";
    setTimeout(() => {
      menu.remove();
      menu = undefined;
    }, 200);
  }
}

document.onclick = () => {
  closeContextmenu()
};
