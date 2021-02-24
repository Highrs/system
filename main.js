'use strict';

const draw = require('./draw.js');
const onml = require('onml');

const kepCalc = (a, e, t, t0, w, lang, inc, maz) => {
  a = a * Math.pow(10, 9);
  const g = 6.674 * Math.pow(10, -11); // Gravitational constant G
  const mass = 2 * Math.pow(10, 30); // Central object mass, approximately sol
  const u = g * mass; // Standard gravitational parameter u

  const calcMinorAxis = (a, e) => {return ( a * Math.sqrt(1 - e * e) );};
  const b = (calcMinorAxis(a, e)); // minorAxis b[m]

  const calcFocalShift = (a, b) => {return ( Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)) );};
  const focalShift = (calcFocalShift(a, b)); // distance of focus from elypse center

  const epoch = t0; //epoch (given) (days)

  const calcMat = (t, epoch) => {
    let tdiff = ( 86400 * ( t - epoch ) );
    let mat = maz + ( tdiff * Math.sqrt( u / Math.pow(a, 3) ) );
    while (mat < 0) {
      mat += Math.PI * 2;
    }
    mat = mat % (Math.PI * 2);
    return mat;
  }; // Mean anomaly at epoch M(t)
  const mat = calcMat(t, epoch); // Mean Anomaly at Time

  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)
  const itter = 3;
  const calcEAT = (e, mat) => {
    let eat = mat;
    for (let i = 0; i < itter; i++) {
      eat = eat - ( (eat - ( e * Math.sin(eat) ) - mat) / ( 1 - e * Math.cos(eat) ) );
    }
    return eat;
  }; // Eccentric anomaly at time E(t)
  const eat = calcEAT(e, mat); // Eccentric anomaly at time

  const calcTAT = (e, eat) => {
    return ( 2 * Math.atan2(
      ( Math.sqrt(1 + e) * Math.sin(eat / 2) ),
      ( Math.sqrt(1 - e) * Math.cos(eat / 2) )
    ) );
  }; // True Anomaly at Time v(t)
  const tat = calcTAT(e, eat);

  const calcDisanceToCentral = (a, e, eat) => {
    return ( a * ( 1 - ( e * Math.cos(eat) ) ) );
  };
  const dist = calcDisanceToCentral(a, e, eat);

  // Positional vectors in orbital frame o(t)
  const ox = dist * Math.cos(tat);
  const oy = dist * Math.sin(tat);
  // const oz = 0;

  const x = ( ox * ( (Math.cos(w) * Math.cos(lang)) - (Math.sin(w) * Math.cos(inc) * Math.sin(lang)) ) - oy * ( (Math.sin(w) * Math.cos(lang)) + (Math.cos(w) * Math.cos(inc) * Math.sin(lang)) ) );
  const y = ( ox * ( (Math.cos(w) * Math.sin(lang)) + (Math.sin(w) * Math.cos(inc) * Math.cos(lang)) ) + oy * ( (Math.cos(w) * Math.cos(inc) * Math.cos(lang)) - (Math.sin(w) * Math.sin(lang)) ) );
  const z = ( ox * ( Math.sin(w) * Math.sin(inc) ) + oy * ( Math.cos(w) * Math.sin(inc) ) );

  return { x: x, y: y, z: z, focalShift: focalShift };
};

const makePlanet = (name, a, e, t, t0, w, lang, inc, maz) => {

  const planDat = kepCalc(a, e, t, t0, w, lang, inc, maz);

  const planet = {
    name: name,
    objectRadius: 5,

    a: a, // semiMajorAxis a[m] (given)
    e: e, // eccentricity e[1] (given)
    // b: b,
    t: t,
    t0: t0,
    w: w,
    lang: lang,
    inc: inc,
    maz: maz,
    // epoch: epoch,

    focalShift: planDat.focalShift,
    x: planDat.x,
    y: planDat.y,
    z: planDat.z,
  };
  return planet;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {

  // 1 AU = 150 million km
  // let t = 0;

  const planets = [];
  // makePlanet takes: (name, a, e, t, w, lang, inc, maz)
  planets.push(
    makePlanet(
      'Alpha', // name
      150,    // semi-major axis (a)
      0.8,    // eccentricity (e)
      0,      // time (days) (t)
      0,      // epoch (days) (t0)
      2,      // argument of periapsis (w)
      0,      // longitude of ascention node (lang)
      1,      // inclanation (inc)
      0       // mean anomaly at zero (maz)
    ),
    makePlanet(
      'Beta', // name
      200,    // semi-major axis (a)
      0.2,    // eccentricity (e)
      0,      // time (t)
      0,      // epoch (days)
      4,      // argument of periapsis (w)
      1.6,      // longitude of ascention node (lang)
      0.5,    // inclanation (inc)
      0       // mean anomaly at zero (maz)
    ),
    makePlanet(
      'Gamma', // name
      300,    // semi-major axis (a)
      0.0,    // eccentricity (e)
      0,      // time (t)
      0,      // epoch (days)
      0,      // argument of periapsis (w)
      0,      // longitude of ascention node (lang)
      0,      // inclanation (inc)
      0       // mean anomaly at zero (maz)
    )
  );
  onml.renderer(document.getElementById('content'))(draw.drawMap(planets));
  const render2 = onml.renderer(document.getElementById('moving'));
  while (true) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 3);

    const clock2 = Date(clock);


    for (let i = 0; i < planets.length; i++) {
      let newData = kepCalc(planets[i].a, planets[i].e, t, planets[i].t0, planets[i].w, planets[i].lang, planets[i].inc, planets[i].maz);
      planets[i].x = newData.x;
      planets[i].y = newData.y;
      planets[i].z = newData.z;
      // console.log(planets[i]);
    }

    render2(draw.drawMoving(planets, clock2));
    // t += 0.1;
    await delay(2000);
  }
  // return;
};

window.onload = main;
