'use strict';
const renderer = require('onml/renderer.js');
const drawMap = require('./drawMap.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hullTemps = require('./hullTemp.js');
const constructs = require('./constructs.json');
const craft = require('./craft.js');
const majObj = require('./majorObjects2.json');
const ui = require('./ui.js');
const PI = Math.PI;

const makeStar = (staro) => {
  return staro;
};
const makeBody = (inBodyo) => {
  const bodyo = Object.assign(
    inBodyo,
    {
      x: 0, y: 0, z: 0,
      sphereOfInfluence: 10,
      orient: 90,
      inputsList: [],
      outputsList: [],
      owner: 'EMPIRE',
      orbitPointsArr: [],
      orbitDivLine: [],
      primaryo: majObj[inBodyo.primary]
    }
  );
  ind.initInd(bodyo);

  let points = 128;
  if (bodyo.type === 'moon') {points = 32;}

  for (let i = 0; i < points; i++) {
    let currCoord = mech.kepCalc(bodyo, undefined, 's', ((i * 2 * PI) / points));

    bodyo.orbitPointsArr[i] = currCoord;

    if (i === 0) {
      bodyo.orbitDivLine[0] = currCoord;
    } else if (Math.abs(points/2 - i) < 1) {
      bodyo.orbitDivLine[1] = currCoord;
    }
  }

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
const makeManyCraft = (craftType, numberToMake, craftList, owner = undefined) => {
  for (let i = 0; i < numberToMake; i++) {
    const baseTemplate = hullTemps[craftType]();
    craftList.push(craft.makeCraft(baseTemplate, owner));
  }
};
Window.options = {
  rate: 1,
  rateSetting: 3,
  simRates: [0, 0.1, 0.5, 1, 2, 3, 5, 10],
  targetFrames: 30,
  header: false,
  headerKeys: true,
  planetData: true,
  craftData: true,
  stop: false,
  intercepts: true,
  keyPanStep: 50,
  isPaused: false,
  settingsWindow: false
};
const options = Window.options;
let mapPan = {
  x: 0,
  y: 0,
  xLast: 0,
  yLast: 0,
  zoom: 1,
  zoomLast: 1,
  cursOriginX: 0,
  cursOriginY: 0,
  mousePosX: 0,
  mousePosY: 0,
  zoomChange: 0,
  interceptUpdated: true
};
const updatePan = (mapPan) => {
  // Update Pan here
  if ((mapPan.x != mapPan.xLast) || (mapPan.y != mapPan.yLast)) {
    document.getElementById('map').setAttribute(
      'transform', 'translate(' + mapPan.x + ', ' + mapPan.y + ')'
    );
    mapPan.xLast = mapPan.x;
    mapPan.yLast = mapPan.y;
    return true;
  }
  return false;
};
const updateZoom = (mapPan) => {
  // Updates Zoom (WHO WHOULDA THOUGHT?)
  if (mapPan.zoomChange != 0) {
    if (mapPan.zoom + mapPan.zoomChange < 0.5) {
      mapPan.zoom = 0.5;
    } else if (mapPan.zoom + mapPan.zoomChange > 5) {
      mapPan.zoom = 5;
    } else {
      mapPan.zoom += mapPan.zoomChange;
    }
    mapPan.x = mapPan.mousePosX + (mapPan.x - mapPan.mousePosX) * (mapPan.zoom / mapPan.zoomLast);
    mapPan.y = mapPan.mousePosY + (mapPan.y - mapPan.mousePosY) * (mapPan.zoom / mapPan.zoomLast);

    // console.log(mapPan.x);
    mapPan.zoomChange = 0;
    mapPan.zoomLast = mapPan.zoom;
    return true;
  }
  return false;
};
const main = async () => {
  console.log('Giant alien spiders are no joke!');
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

  let movBod = [].concat(planets, moons, asteroids, stations);
  belts.forEach(e => (movBod = movBod.concat(e.rocks)));

  // makeManyCraft('menace', 1, craftList, 'Pirate');
  makeManyCraft('brick', 4, craftList);
  makeManyCraft('boulder', 4, craftList);
  makeManyCraft('mountain', 2, craftList);
  makeManyCraft('barlog', 1, craftList);

  craftStart(craftList);

  let renderStatic = undefined;
  let renderStaticOrbits = undefined;
  let renderStars = undefined;
  let renderGrid = undefined;
  let renderMoving = undefined;
  let rendererIntercept = undefined;
  let interceptDraw = () => {};
  let rendererMovingOrbits = undefined;

  let renderRateCounter = undefined;
  let renderScreenFrame = undefined;

  const initRateRenderer = () => {
    renderRateCounter     = renderer(document.getElementById('rateCounter'));
  };
  const initRenderers = () => {
    renderStatic          = renderer(document.getElementById('content'));
    renderStatic(drawMap.drawStatic(options, stars));
    renderStaticOrbits    = renderer(document.getElementById('staticOrbits'));
    renderStars           = renderer(document.getElementById('stars'));
    renderGrid            = renderer(document.getElementById('grid'));
    renderMoving          = renderer(document.getElementById('moving'));
    rendererIntercept     = renderer(document.getElementById('intercept'));
    interceptDraw         = () => {
      rendererIntercept(drawMap.drawIntercepts(craftList, mapPan));
      mapPan.interceptUpdated = false;
    };
    rendererMovingOrbits  = renderer(document.getElementById('movingOrbits'));
    renderScreenFrame   = renderer(document.getElementById('screenFrame'));
  };



  mapPan.x = document.body.clientWidth / 2;
  mapPan.y = document.body.clientHeight / 2;

  const renderAllMoving = (options, stars, planets, mapPan) => {
    renderStaticOrbits(drawMap.drawOrbits(planets, mapPan));
    renderStars(drawMap.drawStars(stars, mapPan));
    renderGrid(drawMap.drawGrid(stars[0], mapPan));
  };
  const updateRateCounter = (options) => {
    renderRateCounter(drawMap.drawRateCounter(options));
  };

  initRenderers();
  initRateRenderer();
  renderAllMoving(options, stars, planets, mapPan);
  updateRateCounter(options);

  const reRenderAll = () => {
    document.getElementById('allTheStuff').setAttribute('width', document.body.clientWidth);
    document.getElementById('allTheStuff').setAttribute('height', document.body.clientHeight);
    document.getElementById('allTheStuff').setAttribute('viewBox',
      [0, 0, document.body.clientWidth + 1, document.body.clientHeight + 1].join(' ')
    );
    renderScreenFrame(drawMap.drawScreenFrame(options));
  };

  ui.addListeners(options, mapPan, reRenderAll);
  ui.addRateListeners(options, updateRateCounter);

// <---------LOOP---------->
  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  const loop = () => {
    let time = performance.now();
    let timeDelta = time - clockZero;
    clockZero = time;

    if ( !(options.isPaused) ) {
      let workTime = (timeDelta * options.rate * simpRate);
      currentTime += workTime;

      for (let i = 0; i < movBod.length; i++) {
        movBod[i].t = currentTime;
        let newData = mech.kepCalc(movBod[i]);
        ['x', 'y', 'z'].forEach(e => {movBod[i][e] = newData[e];});
        orientOnSun(movBod[i], newData);
      }

      if (updateZoom(mapPan)) {
        mapPan.interceptUpdated = true;
        renderAllMoving(options, stars, planets, mapPan);
      }
      updatePan(mapPan);

      renderMoving(
        drawMap.drawMoving(options, Date(currentTime), planets, moons, asteroids, belts,
        craftList, stations, rendererMovingOrbits, mapPan)
      );

      craftList.forEach(crafto => {
        craft.craftAI(crafto, indSites, craftList, workTime, stars[0], sysObjects, mapPan);
      });

      if (mapPan.interceptUpdated) {interceptDraw();}

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
