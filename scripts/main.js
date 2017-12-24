const fs = require('fs-extra');
const path = require('path');
const url = require('url');

const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
// init win
let mainWindow, addbotWindow;
let directory;

app.on('ready', createWindow);
function createWindow() {
  //Create Browser Windows
  mainWindow = new BrowserWindow({ width:800, height:470, 
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
    label:'File',
    submenu:[
      {
        label:'Exit',
        accelerator: "CommandOrControl+Q",
        click(){
          app.quit();
        }
      }
    ]
  }
];

// ADD BOT WINDOW
ipcMain.on('bot:add', function(e) {
  if(addbotWindow != null){
    addbotWindow.close();
  }
  const modalPath = path.join(__dirname, '../app/addWindow.html');
  addbotWindow = new BrowserWindow({ frame: true, 
                                     width:350, height:180, 
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

if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Dev Tools',
    submenu:[
      {
        label: 'Toggle DevTools',
        accelerator: "CommandOrControl+i",
        click(item, focusedWindow){
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
function initGit(){
  const git = require('simple-git');
  //download / update from openkore from github
  if (!fs.existsSync( path.join(__dirname, '../openkore' ) )) {
    console.log('== Cloning Openkore ===');
    git().silent(true).clone("https://github.com/OpenKore/openkore.git").then(() => {
      fs.createReadStream( path.join(__dirname, '../SimpleWin32.pm') ).pipe( fs.createWriteStream( path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm') ) );
      console.log('=== Finished Cloning Openkore ===');
    });
  }else{
    console.log('updating openkore');
    git( path.join(__dirname, '../openkore') ).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      fs.createReadStream( path.join(__dirname, '../SimpleWin32.pm') ).pipe( fs.createWriteStream( path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm') ) );
      console.log('=== Finished Updating Openkore ===');
    });
  }
  //download / update from legit repo
  if (!fs.existsSync( path.join(__dirname, '../iro-restart-repo') )) {
    console.log('=== Cloning iro-restart-repo ===');
    git().silent(true).clone("https://github.com/PoringUniverse/iro-restart-repo.git").then(() => {
      console.log('== Finished Cloning iro-restart-repo ===')
    });
    
  }else{
    console.log('=== Updating iro-restart-repo ===');
    git( path.join(__dirname, '../iro-restart-repo') ).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      console.log('=== Finished Updating iro-restart-repo ===')
    });
  }
}

const { spawn } = require('child_process');
var selectedID = 0;
var botCount = 0 ;
var bots = new Array();
var botRunning = new Array();
var botConfig = new Array();
var botOutput = new Array();



ipcMain.on('console:send', function(e, input){
  bots[selectedID].stdin.write(input  + "\n");  
});

//INIT BOTS
ipcMain.on('bot:init', function(e) {
  console.log("init Bots");
  const dir = path.join( app.getAppPath() , 'bots');
  botCount = 0 ;
  fs.readdir(dir, (err, files) => {
    files.forEach(element => {
      if( element != "donotdelete" ){
        mainWindow.webContents.send('Bot:add',element,botCount);
        botConfig[botCount] = element;
        botOutput[botCount] = new Array();
        botRunning[botCount] = false;
        botCount++;
      }
    });
  });
})


ipcMain.on('bot:start', function(e) {
  var BotID = selectedID;
  if(!botRunning[selectedID]){
    bots[selectedID] = spawn('start.exe', ["--interface=SimpleWin32", "--control=../bots/" + botConfig[selectedID] ] , { cwd: app.getAppPath() + '\\openkore\\' } );
    bots[selectedID].stdout.on('data', (data) => {
      botOutput[BotID].push(data.toString());
      while(botOutput[BotID].length > 50){
        botOutput[BotID].shift();
      }
      botOutputHolder[BotID] = data.toString();
      consoleWindowTitle(data.toString(),BotID);
    });
      bots[BotID].stderr.on('data', (data) => {
      botOutput[BotID].push(data.toString());
      while(botOutput[BotID].length > 50){
        botOutput[BotID].shift();
      }
      botOutputHolder[BotID] = data.toString();
      consoleWindowTitle(data.toString(),BotID);
    });
    botRunning[BotID] = true;
    mainWindow.webContents.send('console:setStartButton','stop','stop');
  }else{
    bots[BotID].kill();
    botRunning[BotID] = false;
    botOutput[BotID] = new Array();
    mainWindow.webContents.send('console:setStartButton','start', 'play');
  }
  
})

ipcMain.on('bot:select', function(e, index) {
  selectedID = index;
  mainWindow.webContents.send('console:setStartButton',botRunning[selectedID] ? 'Stop' : 'Start', botRunning[selectedID] ? 'stop' : 'play');
  botOutput[selectedID].forEach(element => {
    consoleWindowTitle(element,selectedID);
  });
})



ipcMain.on('bot:addnew', function(e, name) {
  const openkoreControl_dir = path.join( app.getAppPath() , 'openkore/control/');
  const botControlDist = path.join( app.getAppPath() , 'bots/' + name + '/');
  fs.copy(openkoreControl_dir,botControlDist);
  botCount++;
  mainWindow.webContents.send('Bot:add',name,botCount);
  botConfig[botCount] = name;
  botOutput[botCount] = new Array();
  botRunning[botCount] = false;
  addbotWindow.close();
});

function consoleWindowTitle(msg , id){
  if( id == selectedID ){
    if( msg.includes("{TITLE}") ){
      mainWindow.webContents.send('console:title',msg.replace('{TITLE}',''));
    }else{
      mainWindow.webContents.send('console:log',msg);
    }
  }
}

var botOutputHolder = new Array();
function consolebuffer() {
  for (let index = 0; index < botCount; index++) {
    try {
      if( botRunning[index] && botOutput[index][botOutput[index].length-1] == botOutputHolder[index] ){
        
        if( !botOutput[index][botOutput[index].length-1].includes("~input~") ){
          bots[index].stdin.write("\n");
        }
      }
    }catch(err) {}
  }
  setTimeout(consolebuffer, 2 * 1000);
}
consolebuffer();