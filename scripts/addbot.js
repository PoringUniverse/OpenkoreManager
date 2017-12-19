"use strict";

const electron = require('electron');
const remote = require('electron').remote;
const {ipcRenderer} = electron;
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');


const btnCancel = document.querySelector(".cancel-button");
const btnAdd = document.querySelector(".add-bot-button");

btnCancel.addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    window.close(); 
});

btnAdd.addEventListener("click", function (e) {
    const botname = document.querySelector("#botName").value;
    if( botname == '' ){
        document.querySelector("#botName").classList.add("is-invalid");
        document.querySelector("#botName").focus();
    }else{
        ipcRenderer.send('bot:addnew', botname);
    }
});