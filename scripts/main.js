const fs = require('fs-extra');
const path = require('path');
const url = require('url');

const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
// init win
let mainWindow,addbotWindow;
let Directory;

app.on('ready', createWindow);
function createWindow() {
  //Create Browser Windows
  mainWindow = new BrowserWindow({width:1024, height:600, icon: path.join(__dirname, '../img/icon.png') });

  // Load Index.html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../pages/index.html'),
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
  const modalPath = path.join(__dirname, '../pages/addbot.html');
  addbotWindow = new BrowserWindow({ frame: false, width:320, height:230, parent: mainWindow, modal:true, show:false });
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
    console.log('cloning openkore');
    git().silent(true).clone("https://github.com/OpenKore/openkore.git").then(() => {
      fs.createReadStream( path.join(__dirname, '../SimpleWin32.pm') ).pipe( fs.createWriteStream( path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm') ) );
      console.log('finished cloning openkore');
    });
  }else{
    console.log('updating openkore');
    git( path.join(__dirname, '../openkore') ).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      fs.createReadStream( path.join(__dirname, '../SimpleWin32.pm') ).pipe( fs.createWriteStream( path.join(__dirname, '../openkore/src/interface/SimpleWin32.pm') ) );
      console.log('finished updating openkore');
    });
  }
  //download / update from legit repo
  if (!fs.existsSync( path.join(__dirname, '../iro-restart-repo') )) {
    console.log('cloning iro-restart-repo');
    git().silent(true).clone("https://github.com/PoringUniverse/iro-restart-repo.git").then(() => {
      console.log('finished cloning iro-restart-repo')
    });
    
  }else{
    console.log('updating iro-restart-repo');
    git( path.join(__dirname, '../iro-restart-repo') ).pull().tags((err, tags) => console.log("Latest available tag: %s", tags.latest)).then(() => {
      console.log('finished updating iro-restart-repo')
    });
  }
}


const { spawn } = require('child_process');
var selectedID = 0;
var botCount = 0 ;
var Bots = new Array();
var BotRunning = new Array();
var BotConfig = new Array();
var BotOutput = new Array();

function ConsoleOut(msg , id){
  if( id == selectedID ){
    if( msg.search("TITLE") > -1 ){
      mainWindow.webContents.send('console:title',msg.replace('{TITLE}',''));
    }else{
      mainWindow.webContents.send('console:log',msg);
    }
  }
}

ipcMain.on('console:send', function(e, input){
  Bots[selectedID].stdin.write(input  + "\n");
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
        BotConfig[botCount] = element;
        BotOutput[botCount] = new Array();
        BotRunning[botCount] = false;
        botCount++;
      }
    });
  });
})


ipcMain.on('bot:start', function(e) {
  var myID = selectedID;
  if(!BotRunning[selectedID]){
    
    Bots[selectedID] = spawn('start.exe', ["--interface=SimpleWin32", "--control=../bots/" + BotConfig[selectedID] ] , { cwd: app.getAppPath() + '\\openkore\\' } );
    Bots[selectedID].stdout.on('data', (data) => {
      BotOutput[myID].push(data.toString());
      ConsoleOut(data.toString(),myID);
    });

    Bots[myID].stderr.on('data', (data) => {
      BotOutput[myID].push(data.toString());
      ConsoleOut(data.toString(),myID);
    });
    BotRunning[myID] = true;

  }else{
    Bots[myID].kill();
    BotRunning[myID] = false;
  }
  
})

ipcMain.on('bot:select', function(e, index) {
  selectedID = index;
  while(BotOutput[selectedID].length > 50){
    BotOutput[selectedID].shift();
  }
  BotOutput[selectedID].forEach(element => {
    ConsoleOut(element,selectedID);
  });
})



ipcMain.on('bot:addnew', function(e, name) {
  const openkoreControl_dir = path.join( app.getAppPath() , 'openkore/control/');
  const botControlDist = path.join( app.getAppPath() , 'bots/' + name + '/');
  fs.copy(openkoreControl_dir,botControlDist);
  botCount++;
  mainWindow.webContents.send('Bot:add',name,botCount);
  BotConfig[botCount] = name;
  BotOutput[botCount] = new Array();
  BotRunning[botCount] = false;
  addbotWindow.close();
});