'use strict';

const electron = require('electron');
const remote = require('electron').remote;
const {ipcRenderer} = electron;
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');


const btnCancel = document.querySelector(".cancel-button");
const btnAdd = document.querySelector(".addbot-button");

btnCancel.addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    window.close(); 
});

btnAdd.addEventListener("click", function (e) {
    const botname = document.querySelector("#bot-name").value;
    if( botname == '' ){
        document.querySelector("#bot-name").classList.add("is-invalid");
        document.querySelector("#bot-name").focus();
    }else{
        ipcRenderer.send('bot:addnew', botname);
    }
});