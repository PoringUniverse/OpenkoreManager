"use strict";
const electron = require('electron');
const {ipcRenderer} = electron;
window.$ = window.jQuery = require('jquery'), require("jquery-ui");
window.Bootstrap = require('bootstrap');
ipcRenderer.send('bot:init');

//console
const openkore = document.querySelector(".openkore-console");
const btnSendCommand = document.querySelector(".button-send");
const btnStart = document.querySelector(".button-start");

ipcRenderer.on('console:title', function(e,msg){
    document.querySelector("#consoleTitle").innerHTML = msg;
});

function clearOldMsg(){
    var logCount = openkore.childElementCount;
    while(logCount > 20){
        openkore.removeChild(openkore.firstChild);
        logCount = openkore.childElementCount;
    }
}

btnSendCommand.addEventListener('click', submitInput);

document.querySelector("#inputCommand").addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter
        const consoleInput = document.querySelector("#inputCommand").value;
        ipcRenderer.send('console:send', consoleInput);
        document.querySelector("#inputCommand").value = "";
    }
});

function submitInput(e){
    const consoleInput = document.querySelector("#inputCommand").value;
    ipcRenderer.send('console:send', consoleInput);
    document.querySelector("#inputCommand").value = "";
}
//end console

//Bot List
const botList = document.querySelector(".bot-list");

ipcRenderer.on('Bot:add', function(e, botName, botId) {
    const bot = document.createElement('li');
    // bot.classList.add("list-group-item");
    // bot.classList.add("list-group-item-action");
    if(botId == 0 ){
        bot.classList.add("active");
        document.querySelector("#consoleTitle").innerHTML = "Console: " + botName;
    }
    bot.id = botId;
    bot.innerHTML = '<a href="#">' + botName + ' <i class="fa fa-circle bot-indicator" aria-hidden="true" style="color:green;display:none"></i></a>';
    bot.addEventListener("click", selectBot);
    botList.appendChild(bot);
});

function selectBot(e){
    document.querySelector(".active").classList.remove("active");
    document.querySelector("#consoleTitle").innerHTML = "Console: " + this.textContent;
    this.classList.add("active");
    openkore.innerHTML = "";
    ipcRenderer.send('bot:select', this.id);
};

btnStart.addEventListener("click", function (e) {
    const status = document.querySelector(".active");
    const d = status.querySelector('.bot-indicator').style.display;
    status.querySelector('.bot-indicator').style.display = (d == 'none'? 'inline':'none');
    ipcRenderer.send('bot:start');
});

ipcRenderer.on('console:setStartButton', function(e,msg,icon){
    if( icon == 'play' )
        openkore.innerHTML = "";
    btnStart.innerHTML = `<i class="fa fa-${icon}" aria-hidden="true"></i> ${msg}`;
});


// document.querySelector(".bot-add").addEventListener("click", function (e) {
//     ipcRenderer.send('bot:add');
// });

ipcRenderer.on('console:log', function(e,msg){
    const cmsg = msg.split("~");
    const line = document.createElement('li');
    line.style.color = cmsg[0] != '' ? cmsg[0] : 'white';
    const consoleText = document.createTextNode(cmsg[1]);
    line.appendChild(consoleText);
    openkore.appendChild(line);
    openkore.scrollTop = openkore.scrollHeight;
    clearOldMsg();
});