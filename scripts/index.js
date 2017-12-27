"use strict";
const electron = require('electron');
var remote = require('electron').remote;
const { ipcRenderer } = electron;
window.$ = window.jQuery = require('jquery'), require("jquery-ui");
window.Bootstrap = require('bootstrap');

//init Vue
var app = new Vue({
    el: '#app',
    data: {
        SelectedID: 0,
        profiles: [{
            Console: null,
            Config: "element",
            Output: [],
            OutputHolder: new Array(),
            IsRunning: false,
            ID: 0
        }]
    },
    methods: {
        AddProfile: function (botProfile) {
            this.profiles.push(botProfile);
            this.SelectedID = botProfile.ID;
        },
        SelectProfile: function (bot) {
            this.SelectedID = bot.ID;
            ipcRenderer.send('bot:select', bot.ID);
        },
        UpdateProfile: function (bot){
            this.profiles[bot.ID].Config = bot.Config
            this.profiles[bot.ID].Output = bot.Output
            this.profiles[bot.ID].IsRunning = bot.IsRunning
            this.profiles[bot.ID].Title = bot.Title
        },
        StartPRofile: function (){
            ipcRenderer.send('bot:start');
        }
    },
    computed: {
        Selected: function () {
            return this.profiles[this.SelectedID];
        }
    }
})

//load Bot Profile
app.profiles.pop();
ipcRenderer.send('bot:init');

const btnSendCommand = document.querySelector(".button-send");
btnSendCommand.addEventListener('click', submitInput);

ipcRenderer.on('console:title', function (e, msg) {
    document.querySelector("#consoleTitle").innerHTML = msg;
});

ipcRenderer.on('update:bot', function (e, bot) {
    app.UpdateProfile(bot);
    document.querySelector(".openkore-console").scrollTop = document.querySelector(".openkore-console").scrollHeight;
});

ipcRenderer.on('Bot:add', function (e, botProfile) {
    app.AddProfile(botProfile);
});

document.querySelector("#inputCommand").addEventListener('keypress', function (e) {
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter
        const consoleInput = document.querySelector("#inputCommand").value;
        ipcRenderer.send('console:send', consoleInput);
        document.querySelector("#inputCommand").value = "";
    }
});

function submitInput(e) {
    const consoleInput = document.querySelector("#inputCommand").value;
    ipcRenderer.send('console:send', consoleInput);
    document.querySelector("#inputCommand").value = "";
}

// document.querySelector(".bot-add").addEventListener("click", function (e) {
//     ipcRenderer.send('bot:add');
// });
