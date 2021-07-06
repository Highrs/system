'use strict';
const renderer = require('onml/renderer.js');
const drawMap = require('./drawMap.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hulls = require('./hulls.js');
const craft = require('./craft.js');
const majObj = require('./majorObjects2.json');

const makeStar = (staro) => {
  return staro;
};

const makeBody = (bodyo) => {
  ind.initInd(bodyo);
  const bodyDat = mech.kepCalc(bodyo, 0);
  const body = Object.assign(
    bodyo,
    {
      focalShift: bodyDat.focalShift,
      x: 0, y: 0, z: 0,
      soi: 10
    }
  );
  return body;
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

let rock = (belto) => {
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
  craftList.map(crafto => {
    ['x', 'y', 'z'].map(e => {
      crafto[e] = majObj[crafto.home][e];
    });
    crafto.lastStop = majObj[crafto.home];
  });
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

  const craftList = [];

  Object.keys(majObj).map(objName => {
    let theObj = majObj[objName];

    switch(theObj.type){
      case 'star': stars.push(makeStar(theObj)); break;
      case 'planet' : planets.push(makeBody(theObj)); break;
      case 'moon': moons.push(makeBody(theObj)); break;
      case 'asteroid': asteroids.push(makeBody(theObj)); break;
      case 'belt': belts.push(makeBelt(theObj)); break;
      default: console.log('ERROR at make. Skipping.');
    }

    if (theObj.industry) {indSites.push(theObj);}
  });

  let movBod = [];
  movBod = movBod.concat(planets, moons, asteroids);
  belts.map(e => movBod = movBod.concat(e.rocks));

  const makeManyCraft = (craftType, number) => {
    for (let i = 0; i < number; i++) {
      craftList.push(craft.makeCraft(hulls[craftType]()));
    }
  };

  makeManyCraft('brick', 8);
  makeManyCraft('boulder', 4);
  makeManyCraft('mountain', 2);

  Window.options = {
    rate: 1,
    targetFrames: 60,
    header: false,
    planetData: false,
    craftData: false,
  };
  const options = Window.options;

  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  renderer(document.getElementById('content'))(drawMap.drawStatic(options, stars, planets));
  const renderMoving = renderer(document.getElementById('moving'));
  const rendererIntercept = renderer(document.getElementById('intercept'));

  const loop = () => {
    let time = performance.now();
    let timeDelta = time - clockZero;
    clockZero = time;
    currentTime += timeDelta * options.rate * simpRate;

    for (let i = 0; i < movBod.length; i++) {
      movBod[i].t = currentTime;
      let newData = mech.kepCalc(movBod[i]);
      ['x', 'y', 'z'].map(e => {movBod[i][e] = newData[e];});
    }

    if (!craftList[0].x) {
      craftStart(craftList);
    }

    craftList.forEach(crafto => {
      craft.craftAI(crafto, indSites, rendererIntercept, craftList,
        (timeDelta * options.rate * simpRate));
    });

    renderMoving(
      drawMap.drawMoving(options, Date(currentTime), planets, moons, asteroids, belts,
        craftList));

    setTimeout(loop, 1000/options.targetFrames);
  };
  loop();
};

window.onload = main;
