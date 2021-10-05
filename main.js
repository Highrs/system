'use strict';
const renderer = require('onml/renderer.js');
const drawMap = require('./drawMap.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hullTemps = require('./hullTemp.js');
const constructs = require('./constructs.json');
const craft = require('./craft.js');
const majObj = require('./majorObjects2.json');

const makeStar = (staro) => {
  return staro;
};
const makeBody = (inBodyo) => {
  // const bodyDat = mech.kepCalc(bodyo, 0);
  const bodyo = Object.assign(
    inBodyo,
    {
      // focalShift: bodyDat.focalShift,
      x: 0, y: 0, z: 0,
      sphereOfInfluence: 10,
      orient: 90,
      inputsList: [],
      outputsList: [],
      owner: 'EMPIRE'
    }
  );
  ind.initInd(bodyo);
  return bodyo;
};
const rockNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};
function rand(mean, deviation, prec = 0, upper = Infinity, lower = 0) {
  let max = mean + deviation > upper ? upper : mean + deviation;
  let min = mean - deviation < lower ? lower : mean - deviation;

  return (
    ( Math.round(
      (Math.random() * (max - min) + min) * Math.pow(10, prec)
      ) / Math.pow(10, prec)
    )
  );
}
const rock = (belto) => {
  return {
    name: rockNamer(),
    type: 'asteroid',
    primary: belto.primary,
    mass: rand(belto.mass, belto.massd),
    a:    rand(belto.a, belto.ad),
    e:    rand(belto.e, belto.ed, 2),
    t:    0,
    t0:   0,
    w:    rand(belto.w, belto.wd, 2),
    lang: rand(belto.lang, belto.langd, 2),
    inc:  rand(belto.inc, belto.incd, 2),
    maz:  rand(belto.maz, belto.mazd, 2),
    objectRadius: rand(belto.objectRadius, belto.objectRadiusD, 1),
  };
};
const makeBelt = (belto) => {
  const belt = Object.assign(
    belto,
    {rocks: []}
  );
  for (let i = 0; i < belto.count; i++) {
    belt.rocks.push(makeBody(rock(belto)));
  }

  return belt;
};
const craftStart = (craftList) => {
  craftList.forEach(crafto => {
    ['x', 'y', 'z'].forEach(e => {
      crafto[e] = majObj[crafto.home][e];
    });
    crafto.lastStop = majObj[crafto.home];
  });
};
const orientOnSun = (bodyo, newData) => {
  if (bodyo.orient) {
    ['x', 'y', 'z'].forEach(e => {bodyo['p' + e] = newData['p' + e];});
    bodyo.orient = (Math.atan2(bodyo.py - bodyo.y, bodyo.px - bodyo.x) * 180 / Math.PI) + 90;
  }
};
const makeManyCraft = (craftType, numberToMake, craftList) => {
  for (let i = 0; i < numberToMake; i++) {
    const baseTemplate = hullTemps[craftType]();
    craftList.push(craft.makeCraft(baseTemplate));
  }
};
Window.options = {
  rate: 2,
  targetFrames: 30,
  header: false,
  headerKeys: true,
  planetData: true,
  craftData: true,
  stop: false,
  intercepts: true
};
const options = Window.options;
const main = async () => {
  console.log('Giant alien spiders are no joke!');
  console.log('V 0.1.006');
  console.log('Use \' Window.options \' to modify settings.');

  let stars = [];
  let planets = [];
  let moons = [];
  let asteroids = [];
  let indSites = [];
  let belts = [];
  let stations = [];

  let craftList = [];

  let sysObjects = {...majObj,...constructs};

  Object.keys(sysObjects).forEach(objName => {
    let theObj = sysObjects[objName];

    switch(theObj.type){
      case 'star': stars.push(makeStar(theObj)); break;
      case 'planet' : planets.push(makeBody(theObj)); break;
      case 'moon': moons.push(makeBody(theObj)); break;
      case 'asteroid': asteroids.push(makeBody(theObj)); break;
      case 'belt': belts.push(makeBelt(theObj)); break;
      case 'station': stations.push(makeBody(theObj)); break;
      default: console.log('ERROR at make. Skipping.');
    }

    if (theObj.industry) { indSites.push(theObj); }
  });

  let movBod = [];
  movBod = movBod.concat(planets, moons, asteroids, stations);
  belts.forEach(e => (movBod = movBod.concat(e.rocks)));

  makeManyCraft('brick', 8, craftList);
  makeManyCraft('boulder', 4, craftList);
  makeManyCraft('mountain', 2, craftList);
  makeManyCraft('barlog', 1, craftList);

  craftStart(craftList);

  let isPaused = false;
  function pause() { isPaused = true; console.log('|| Paused');}
  function play() { isPaused = false; console.log('>> Unpaused');}

  window.addEventListener('blur', pause);
  window.addEventListener('focus', play);

  const updateMap = () => {console.log('Resized.');};

  window.addEventListener('resize', updateMap);

  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  let mapPan = {
    x: document.body.clientWidth / 2,
    y: document.body.clientHeight / 2,
    xLast: 0,
    yLast: 0,
    zoom: 1,
    zoomLast: 1,
    cursOriginX: 0,
    cursOriginY: 0,
    zoomChange: 0,
    interceptUpdated: false
  };

  const renderStatic          = renderer(document.getElementById('content'));
  renderStatic(drawMap.drawStatic(options, stars));
  const renderStaticOrbits    = renderer(document.getElementById('staticOrbits'));
  const renderStars           = renderer(document.getElementById('stars'));
  const renderGrid            = renderer(document.getElementById('grid'));
  const renderMoving          = renderer(document.getElementById('moving'));
  const rendererIntercept     = renderer(document.getElementById('intercept'));
  const rendererMovingOrbits  = renderer(document.getElementById('movingOrbits'));

  const render = (options, stars, planets, mapPan) => {
    // renderStatic(drawMap.drawStatic(options, stars));
    renderStaticOrbits(drawMap.drawOrbits(planets, mapPan));
    renderStars(drawMap.drawStars(stars, mapPan));
    renderGrid(drawMap.drawGrid(stars[0], mapPan));
  };

  render(options, stars, planets, mapPan);

  const updatePan = (mapPan) => {
    // Update Pan here

    // if (mapPan.x > document.body.clientWidth) {mapPan.x = document.body.clientWidth;}
    // if (mapPan.x < 0) {mapPan.x = 0;}
    // if (mapPan.y > document.body.clientHeight) {mapPan.y = document.body.clientHeight;}
    // if (mapPan.y < 0) {mapPan.y = 0;}

    if ((mapPan.x != mapPan.xLast) || (mapPan.y != mapPan.yLast)) {
      document.getElementById('map').setAttribute(
        'transform', 'translate(' + mapPan.x + ', ' + mapPan.y + ')'
      );
      mapPan.xLast = mapPan.x;
      mapPan.yLast = mapPan.y;
    }
  };

  const updateZoom = (mapPan) => {
    // Update Zoom here
    if (mapPan.zoom != mapPan.zoomLast) {

      if (mapPan.zoom < 0.3) {
        mapPan.zoom = 0.3;
      } else {
        mapPan.x -= (mapPan.cursOriginX * (mapPan.zoomChange));
        mapPan.y -= (mapPan.cursOriginY * (mapPan.zoomChange));
      }
      mapPan.zoomLast = mapPan.zoom;
      // console.log('here');
      return true;
    }
    return false;
  };



  document.getElementById('content').addEventListener('click', function () {console.log('Click!');});
  document.onkeydown = checkKey;
  function checkKey(e) {
    if      (e.keyCode == '38') {/* up arrow */     mapPan.y += 10;}
    else if (e.keyCode == '40') {/* down arrow */   mapPan.y -= 10;}
    else if (e.keyCode == '37') {/* left arrow */   mapPan.x += 10;}
    else if (e.keyCode == '39') {/* right arrow */  mapPan.x -= 10;}
  }

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
  });
  window.addEventListener('mouseup', function () {
    isPanning = false;
  });

  document.getElementById('content').addEventListener('wheel', function (e) {
    const zoomStep = 0.05;
    mapPan.cursOriginX = e.offsetX - mapPan.x;
    mapPan.cursOriginY = e.offsetY - mapPan.y;
    if (e.deltaY < 0) {
      // console.log('Zooming in ... ' + e.offsetX + ' ' + e.offsetY);
      mapPan.zoom += zoomStep;
      mapPan.zoomChange = zoomStep;
    }
    if (e.deltaY > 0) {
      // console.log('Zooming out... ' + e.offsetX + ' ' + e.offsetY);
      mapPan.zoom -= zoomStep;
      mapPan.zoomChange = -zoomStep;
    }
    // updateZoom(mapPan);
  }, {passive: true});



// <---------LOOP---------->

  const loop = () => {
    let time = performance.now();
    let timeDelta = time - clockZero;
    clockZero = time;

    if ( !isPaused ) {
      let workTime = (timeDelta * options.rate * simpRate);
      currentTime += workTime;

      for (let i = 0; i < movBod.length; i++) {
        movBod[i].t = currentTime;
        let newData = mech.kepCalc(movBod[i]);
        ['x', 'y', 'z'].forEach(e => {movBod[i][e] = newData[e];});
        orientOnSun(movBod[i], newData);
      }

      if ((mapPan.zoom != mapPan.zoomLast) || (mapPan.interceptUpdated)) {
        rendererIntercept(drawMap.drawIntercepts(craftList, mapPan));
        mapPan.interceptUpdated = false;
      }

      if (updateZoom(mapPan)) render(options, stars, planets, mapPan);
      updatePan(mapPan);

      renderMoving(
        drawMap.drawMoving(options, Date(currentTime), planets, moons, asteroids, belts,
        craftList, stations, rendererMovingOrbits, mapPan)
      );

      craftList.forEach(crafto => {
        craft.craftAI(crafto, indSites, craftList, workTime, stars[0], sysObjects, mapPan);
      });

      indSites.forEach(bodyo => {
        bodyo.industry.forEach(industyo => {
          ind.indWork(bodyo, industyo, workTime);
        });
      });
    }

    if (options.stop) {return;}

    setTimeout(loop, 1000/options.targetFrames);
  };
  loop();
};

window.onload = main;
