'use strict';

const addRateListeners = (options, updateRateCounter) => {
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
exports.addRateListeners = addRateListeners;
exports.addBoxSettingsListeners = (mapPan, renderBoxSettings) => {
  let boxSettingsSettings = {
    isDragging: false,
    xTransform: 40,
    yTransform: 10,
    xTransformPast: 0,
    yTransformPast: 0,
  };
  document.getElementById('boxMainSettings').setAttribute(
    'transform', 'translate(' + boxSettingsSettings.xTransform + ', ' + boxSettingsSettings.yTransform + ')'
  );
  document.getElementById('boxSettingsDragger').addEventListener('mousedown', e => {
    if (e.which === 1 || e.which === 3) {
      boxSettingsSettings.xTransformPast = e.offsetX;
      boxSettingsSettings.yTransformPast = e.offsetY;
      boxSettingsSettings.isDragging = true;
    }
  });
  document.getElementById('content').addEventListener('mousemove', e => {
    if (boxSettingsSettings.isDragging) {
      boxSettingsSettings.xTransform += e.offsetX - boxSettingsSettings.xTransformPast;
      boxSettingsSettings.yTransform += e.offsetY - boxSettingsSettings.yTransformPast;
      if (boxSettingsSettings.xTransform > document.body.clientWidth - 160) {boxSettingsSettings.xTransform = document.body.clientWidth - 160;}
      if (boxSettingsSettings.yTransform > document.body.clientHeight - 80) {boxSettingsSettings.yTransform = document.body.clientHeight - 80;}
      if (boxSettingsSettings.xTransform < 0) {boxSettingsSettings.xTransform = 0;}
      if (boxSettingsSettings.yTransform < 0) {boxSettingsSettings.yTransform = 0;}
      boxSettingsSettings.xTransformPast = e.offsetX;
      boxSettingsSettings.yTransformPast = e.offsetY;
      document.getElementById('boxMainSettings').setAttribute(
        'transform', 'translate(' + boxSettingsSettings.xTransform + ', ' + boxSettingsSettings.yTransform + ')'
      );
    }
  });
  window.addEventListener('mouseup', function () {
    boxSettingsSettings.isDragging = false;
  });
  document.getElementById('boxSettingsCloser').addEventListener('click', function () {
    mapPan.boxes.boxSettings = false;
    renderBoxSettings([]);
  });
};
exports.addListeners = (options, mapPan, renderers) => {
  document.getElementById('buttonSettings').addEventListener('click', function () {
    if (mapPan.boxes.boxSettings === false) {
      mapPan.boxes.boxSettings = true;
      renderers.boxSettings();
    } else {
      mapPan.boxes.boxSettings = false;
      renderers.boxSettings();
    }
  });
  const checkKey = (e) => {
    if      (e.keyCode == '38') {/* up arrow */     mapPan.y += options.keyPanStep;}
    else if (e.keyCode == '40') {/* down arrow */   mapPan.y -= options.keyPanStep;}
    else if (e.keyCode == '37') {/* left arrow */   mapPan.x += options.keyPanStep;}
    else if (e.keyCode == '39') {/* right arrow */  mapPan.x -= options.keyPanStep;}
  };
  function pause() { options.isPaused = true; console.log('|| Paused');}
  function play() { options.isPaused = false; console.log('>> Unpaused');}

  window.addEventListener('blur', pause);
  window.addEventListener('focus', play);
  window.addEventListener('resize', function() {renderers.resizeWindow();});

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
    if (isPanning) {
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
  // document.
};
