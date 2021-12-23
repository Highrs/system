'use strict';
const drawMap = require('./drawMap.js');
const renderer = require('onml/renderer.js');

const updateMap = () => {console.log('Resized.');};
let renderSettingsWindow = undefined;
let renderRateCounter = undefined;
const genSettingsWindow = (options) => {
  renderSettingsWindow  = renderer(document.getElementById('winBoxes'));
  renderSettingsWindow(drawMap.drawSettingsWindow());
  renderRateCounter     = renderer(document.getElementById('rateCounter'));
  updateRateCounter(options);
};
const updateRateCounter = (options) => {
  renderRateCounter(drawMap.drawRateCounter(options));
};
const makeSettingsWindow = (options) => {
  /* eslint-disable no-undef */
    return WinBox({
      title: "Test123",
      root: document.winBoxes,
      mount: document.getElementById('winBoxes'),
      class: ['windowBox2', 'no-full', 'no-min', 'no-max', 'no-resize'],
      border: "1px",
      x: "center",
      y: "center",
      width: 110,
      height: 100,
      onclose: function(){
        options.settingsWindow = false;
      },
    });
  /* eslint-enable no-undef */
};



const addRateListeners = (options) => {
  // console.log(document.getElementById('buttonStop'));
  document.getElementById('buttonStop').addEventListener('click', function () {
    options.rateSetting = 0;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonSlow').addEventListener('click', function () {
    if (options.rateSetting > 0) {options.rateSetting--;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonFast').addEventListener('click', function () {
    if (options.rateSetting < options.simRates.length - 1) {options.rateSetting++;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonMax').addEventListener('click', function () {
    options.rateSetting = options.simRates.length - 1;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
};

exports.addListeners = (options, mapPan) => {
  let settingsWindow = {};
  document.getElementById('buttonSettings').addEventListener('click', function () {
    if (options.settingsWindow === false) {
      settingsWindow = makeSettingsWindow(options);
      genSettingsWindow(options);
      addRateListeners(options);
      options.settingsWindow = true;
    } else {
      settingsWindow.close();//Find the thing, and close it
    }
  });
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
