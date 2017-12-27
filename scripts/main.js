const fs = require('fs-extra');
const path = require('path');
const url = require('url');

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
// init win
let mainWindow, addbotWindow;
let directory;

app.on('ready', createWindow);
function createWindow() {
  //Create Browser Windows
  mainWindow = new BrowserWindow({
    width: 800, height: 470,
    icon: path.join(__dirname, '../src/img/openkore.ico')
  });

  // Load Index.html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../app/mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
  mainWindow.on('closed', () => {
    app.quit();
  });

  initGit();
}

const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: "CommandOrControl+Q",
        click() {
          app.quit();
        }
      }
    ]
  }
];

// ADD BOT WINDOW
ipcMain.on('bot:add', function (e) {
  if (addbotWindow != null) {
    addbotWindow.close();
  }
  const modalPath = path.join(__dirname, '../app/addWindow.html');
  addbotWindow = new BrowserWindow({
    frame: true,
    width: 350, height: 180,
    icon: path.join(__dirname, '../img/icon.png'),
    parent: mainWindow,
    modal: false,
    show: false,
    movable: true,
    maximizable: false,
    minimizable: false
  });
  addbotWindow.setMenu(null);
  addbotWindow.once("ready-to-show", () => {
    addbotWindow.show();
  });
  addbotWindow.on('close', function () { addbotWindow = null });
  addbotWindow.loadURL(modalPath);
  addbotWindow.show();
})

if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Dev Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: "CommandOrControl+i",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}

// INIT REPO
function initGit() {
  const git = require('simple-git');
  //download / update from openkore from github
  if (!fs.existsSync(path.join(__dirname, '../openkore'))) {
    console.log('== Cloning Openkore ===');
    git().silent(true).clone("https://github.com/OpenKore/openkore.git").then(() => {
      fs.createReadStream(path.join(__dirname, '../SimpleWin32.pm')).pipe(fs.createWriteStream(path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm')));
      console.log('=== Finished Cloning Openkore ===');
    });
  } else {
    console.log('updating openkore');
    git(path.join(__dirname, '../openkore')).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      fs.createReadStream(path.join(__dirname, '../SimpleWin32.pm')).pipe(fs.createWriteStream(path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm')));
      console.log('=== Finished Updating Openkore ===');
    });
  }
  //download / update from legit repo
  if (!fs.existsSync(path.join(__dirname, '../iro-restart-repo'))) {
    console.log('=== Cloning iro-restart-repo ===');
    git().silent(true).clone("https://github.com/PoringUniverse/iro-restart-repo.git").then(() => {
      console.log('== Finished Cloning iro-restart-repo ===')
    });

  } else {
    console.log('=== Updating iro-restart-repo ===');
    git(path.join(__dirname, '../iro-restart-repo')).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      console.log('=== Finished Updating iro-restart-repo ===')
    });
  }
}

const { spawn } = require('child_process');
var selectedID = 0;
var botCount = 0;
global.bots = [];

ipcMain.on('console:send', function (e, input) {
  if (bots[selectedID].IsRunning) {
    bots[selectedID].Console.stdin.write(input + "\n");
  }
});

//INIT BOTS
ipcMain.on('bot:init', function (e) {
  console.log("init Bots");
  const dir = path.join(app.getAppPath(), 'bots');
  botCount = 0;
  bots = [];
  fs.readdir(dir, (err, files) => {
    files.forEach(element => {
      if (element != "donotdelete") {
        var tempBot = {
          Title: element,
          Console: null,
          Config: element,
          Output: [],
          IsRunning: false,
          ID: botCount
        }
        botCount++;
        bots.push(tempBot)
        mainWindow.webContents.send('Bot:add', tempBot);
      }
    });
  });
})

ipcMain.on('bot:start', function (e) {
  var BotID = selectedID;
  var bot = bots[BotID];
  if (!bot.IsRunning) {
    bot.Console = spawn('start.exe', ["--interface=SimpleWin32", "--control=../bots/" + bot.Config], { cwd: app.getAppPath() + '\\openkore\\' });
    bot.Console.stdout.on('data', (data) => {
      if (data.toString().includes("{TITLE}")) {
        bot.Title = data.toString().replace('{TITLE}', '');
      } else {
        var cData = data.toString().split("~");
        bot.Output.push({
          color: cData[0],
          type: cData[1],
          data: cData[2]
        });
      }
      while (bot.Output.length > 50) {
        bot.Output.shift();
      }

    });
    bot.Console.stderr.on('data', (data) => {
      const cData = data.toString().split("~");
      bot.Output.push({
        color: cData[0],
        type: cData[1],
        data: cData[2]
      });
      while (bot.Output.length > 50) {
        bot.Output.shift();
      }
    });

  } else {
    bot.Console.kill();
    bot.Output = new Array();
  }
  bot.IsRunning = !bot.IsRunning;
  mainWindow.webContents.send('update:bot', bot);
})

ipcMain.on('bot:select', function (e, index) {
  selectedID = index;
})

ipcMain.on('bot:addnew', function (e, name) {
  // const openkoreControl_dir = path.join(app.getAppPath(), 'openkore/control/');
  // const botControlDist = path.join(app.getAppPath(), 'bots/' + name + '/');
  // fs.copy(openkoreControl_dir, botControlDist);
  // botCount++;
  // mainWindow.webContents.send('Bot:add', name, botCount);
  // botConfig[botCount] = name;
  // botOutput[botCount] = new Array();
  // botRunning[botCount] = false;
  // addbotWindow.close();
});

function consolebuffer() {
  bots.forEach(bot => {
    try {
      if (bot.IsRunning && bot.Output[bot.Output.length - 1]) {
        var d = bot.Output[bot.Output.length - 1];
        if (!d.type.includes('input')) {
          bot.Console.stdin.write("\n");
        }
      } else {
        bot.Console.stdin.write("\n");
      }
    } catch (err) { }
    mainWindow.webContents.send('update:bot', bot);
  });
  setTimeout(consolebuffer, 2 * 1000);
}
consolebuffer();