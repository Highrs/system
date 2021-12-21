'use strict';
// const WinBox = require('winbox');
// console.log(WinBox);

const updateMap = () => {console.log('Resized.');};
const makeSettingsWindow = (options) => {
  /* eslint-disable no-undef */
    return WinBox({
      title: "Test123",
      // background: "#363636",
      class: ['windowBox2', 'no-full', 'no-min', 'no-max'],
      // border: "2px",
      x: "center",
      y: "center",
      onclose: function(){
        options.settingsWindow = false;
      }
      // font: "B612 Mono"``
    });
  /* eslint-enable no-undef */
};

exports.addListeners = (options, mapPan, updateRateCounter) => {
  const checkKey = (e) => {
    if      (e.keyCode == '38') {/* up arrow */     mapPan.y += options.keyPanStep;}
    else if (e.keyCode == '40') {/* down arrow */   mapPan.y -= options.keyPanStep;}
    else if (e.keyCode == '37') {/* left arrow */   mapPan.x += options.keyPanStep;}
    else if (e.keyCode == '39') {/* right arrow */  mapPan.x -= options.keyPanStep;}
  };
  // let isPaused = false;
  function pause() { options.isPaused = true; console.log('|| Paused');}
  function play() { options.isPaused = false; console.log('>> Unpaused');}

  window.addEventListener('blur', pause);
  window.addEventListener('focus', play);

  window.addEventListener('resize', updateMap);

  document.getElementById('buttonStop').addEventListener('click', function () {
    options.rateSetting = 0;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter();
  });
  document.getElementById('buttonSlow').addEventListener('click', function () {
    if (options.rateSetting > 0) {options.rateSetting--;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter();
  });
  document.getElementById('buttonFast').addEventListener('click', function () {
    if (options.rateSetting < options.simRates.length - 1) {options.rateSetting++;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter();
  });
  document.getElementById('buttonMax').addEventListener('click', function () {
    options.rateSetting = options.simRates.length - 1;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter();
  });


  let settingsWindow = {};
  document.getElementById('buttonSettings').addEventListener('click', function () {
    if (options.settingsWindow === false) {
      settingsWindow = makeSettingsWindow(options);
      options.settingsWindow = true;
    } else {
      settingsWindow.close(true);//Find the thing, and close it
    }
  });

  document.getElementById('content').addEventListener('click', function () {console.log('Click!');});
  document.onkeydown = checkKey;

  let isPanning = false;
  let pastOffsetX = 0;
  let pastOffsetY = 0;
  document.getElementById('content').addEventListener('mousedown', e => {
    if (e.which === 3) {
      pastOffsetX = e.offsetX;
      pastOffsetY = e.offsetY;
      isPanning = true;
    }
  });
  document.getElementById('content').addEventListener('mousemove', e => {
    if (isPanning === true) {
      mapPan.x += e.offsetX - pastOffsetX;
      mapPan.y += e.offsetY - pastOffsetY;
      pastOffsetX = e.offsetX;
      pastOffsetY = e.offsetY;
    }
    mapPan.mousePosX = e.offsetX;
    mapPan.mousePosY = e.offsetY;
  });
  window.addEventListener('mouseup', function () {
    isPanning = false;
  });

  document.getElementById('content').addEventListener('wheel', function (e) {
    const zoomStep = 10**(0.05*mapPan.zoom)-1;
    mapPan.cursOriginX = e.offsetX - mapPan.x;
    mapPan.cursOriginY = e.offsetY - mapPan.y;
    if (e.deltaY < 0) {
      mapPan.zoomChange += zoomStep;
    }
    if (e.deltaY > 0) {
      mapPan.zoomChange -= zoomStep;
    }
  }, {passive: true});
};
