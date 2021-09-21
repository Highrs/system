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
  rate: 1,
  targetFrames: 30,
  header: false,
  planetData: true,
  craftData: true,
  stop: false,
  intercepts: true
};
const options = Window.options;
const main = async () => {
  console.log('Giant alien spiders are no joke!');
  console.log('V 0.1.003');
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

  let mapPan = {
    x: 0,
    y: 0,
    zoom: 1
  };

  document.getElementById('content').addEventListener('click', function () {console.log('Click!');});
  document.onkeydown = checkKey;
  function updatePan() {
    document.getElementById('map').setAttribute('transform', 'translate(' + mapPan.x + ', ' + mapPan.y + ')');
  }
  function checkKey(e) {

    if (e.keyCode == '38') {
        // up arrow
        mapPan.y -= 10;
    }
    else if (e.keyCode == '40') {
        // down arrow
        mapPan.y += 10;
    }
    else if (e.keyCode == '37') {
       // left arrow
       mapPan.x -= 10;
    }
    else if (e.keyCode == '39') {
       // right arrow
       mapPan.x += 10;
    }
    updatePan();
  }

  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  const renderMap = renderer(document.getElementById('content'));
  renderMap(drawMap.drawStatic(options, stars, planets));
  const renderMoving = renderer(document.getElementById('moving'));
  const rendererIntercept = renderer(document.getElementById('intercept'));
  const rendererMovingOrbits = renderer(document.getElementById('movingOrbits'));

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

      craftList.forEach(crafto => {
        craft.craftAI(crafto, indSites, rendererIntercept, craftList, workTime, stars[0], sysObjects);
      });

      indSites.forEach(bodyo => {
        bodyo.industry.forEach(industyo => {
          ind.indWork(bodyo, industyo, workTime);
        });
      });

      renderMoving(
        drawMap.drawMoving(options, Date(currentTime), planets, moons, asteroids, belts,
        craftList, stations, rendererMovingOrbits)
      );
    }

    if (options.stop) {return;}

    setTimeout(loop, 1000/options.targetFrames);
  };
  loop();
};

window.onload = main;
