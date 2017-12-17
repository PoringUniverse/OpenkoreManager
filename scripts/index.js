'use strict';
const electron = require('electron');
const {ipcRenderer} = electron;
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');
ipcRenderer.send('bot:init');
//console
const openkore = document.querySelector(".openkore-console");
const btnconsoleSend = document.querySelector(".button-send");
const btnStart = document.querySelector(".button-start");

ipcRenderer.on('console:log', function(e,msg){
    const line = document.createElement('li');
    const consoleText = document.createTextNode(msg);
    line.appendChild(consoleText);
    openkore.appendChild(line);
    openkore.scrollTop = openkore.scrollHeight;
    Clearoldmsg();
});

ipcRenderer.on('console:title', function(e,msg){
    document.querySelector("#consoleTitle").innerHTML = msg;
});

function Clearoldmsg(){
    var logCount = openkore.childElementCount;
    while(logCount > 50){
        openkore.removeChild(openkore.firstChild);
        logCount = openkore.childElementCount;
    }
}

btnconsoleSend.addEventListener('click', submitInput);

document.querySelector("#input_command").addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter
        const consoleInput = document.querySelector("#input_command").value;
        ipcRenderer.send('console:send', consoleInput);
        document.querySelector("#input_command").value = "";
    }
});

function submitInput(e){
    const consoleInput = document.querySelector("#input_command").value;
    ipcRenderer.send('console:send', consoleInput);
    document.querySelector("#input_command").value = "";
}
//end console

//Bot List
const botList = document.querySelector(".bot-list");

ipcRenderer.on('Bot:add', function(e,botName,botId){
    const bot = document.createElement('a');
    bot.classList.add("list-group-item");
    bot.classList.add("list-group-item-action");
    
    if(botId == 0 ){
        bot.classList.add("active");
        document.querySelector(".botName").innerHTML = botName;
    }
    bot.id = botId;
    bot.innerHTML = botName;
    bot.addEventListener("click",SelectBot);
    botList.appendChild(bot);
});

function SelectBot(e){
    document.querySelector(".active").classList.remove("active");
    document.querySelector(".botName").innerHTML = this.innerHTML;
    this.classList.add("active");
    ipcRenderer.send('bot:select', this.id);
};

btnStart.addEventListener("click", function (e) {
    
    const status = document.querySelector(".active");
    const info = document.createTextNode(" (Running)");
    status.appendChild(info);

    ipcRenderer.send('bot:start');
    
});


document.querySelector(".bot-add").addEventListener("click", function (e) {
    ipcRenderer.send('bot:add');
});