'use strict';

const draw = require('./draw.js');
const onml = require('onml');



const renderer = root => ml => {
  try {
    const html = onml.stringify(ml);
    root.innerHTML = html;
  } catch (err) {
    console.error(ml);
  }
};



const makePlanet = (name, a, e, t) => {
  a = a * Math.pow(10, 9);
  // console.log('Semi-major axis (mill km): ' + a / Math.pow(10, 9));
  const calcFocalShift = (a, b) => {return ( Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)) );}
  const calcMinorAxis = (a, e) => {return ( a * Math.sqrt(1 - e * e) );}
  const g = 6.674 * Math.pow(10, -11); // Gravitational constant G
  const mass = 2 * Math.pow(10, 30); // Central object mass, approximately sol
  const u = g * mass; // Standard gravitational parameter u
  // console.log('Standard gravitational parameter: ' + u);

  const b = (calcMinorAxis(a, e)); // minorAxis b[m]
  // console.log('Minor axis (mill km): ' + b / Math.pow(10, 9));
  const focalShift = (calcFocalShift(a, b)); // distance of focus from elypse center
  // console.log('Focal shift (mill km): ' + focalShift / Math.pow(10, 9));

  const w = 0; // Argument of periapsis w[rad] (given)
  const lang = 0; // Longitude of ascending node (LAN)[rad] (given)
  const inc = 0; // Inclination i[rad] (given)
  const maz = 0; // Mean anomaly at t=0 (given)

  const epoch = 0; //epoch (given) (days)
  // const t = 100; // time of calculation (days)
  // console.log('Epoch (days): ' + epoch);
  // console.log('Time (days): ' + t);

  const calcMat = (t, epoch) => {
    let tdiff = ( 86400 * ( t - epoch ) );
    let mat = maz + ( tdiff * Math.sqrt( u / Math.pow(a, 3) ) );
    while (mat < 0) {
      mat += Math.PI * 2;
    }
    mat = mat % (Math.PI * 2)
    console.log(mat);
    return mat;
  } // Mean anomaly at epoch M(t)
  const mat = calcMat(t, epoch); // Mean Anomaly at Time
  // console.log('Mean anomaly at time ' + mat);

  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)
  const itter = 3;
  const calcEAT = (e, mat) => {
    let eat = mat;
    for (let i = 0; i < itter; i++) {
      eat = eat - ( (eat - ( e * Math.sin(eat) ) - mat) / ( 1 - e * Math.cos(eat) ) );
      console.log(eat);
    }
    return eat;
  } // Eccentric anomaly at time E(t)
  const eat = calcEAT(e, mat); // Eccentric anomaly at time
  // console.log('Eccentric anomaly at time: ' + eat);

  const calcTAT = (e, eat) => {
    return ( 2 * Math.atan2(
      ( Math.sqrt(1 + e) * Math.sin(eat / 2) ),
      ( Math.sqrt(1 - e) * Math.cos(eat / 2) )
    ) );
  } // True Anomaly at Time v(t)
  const tat = calcTAT(e, eat);
  // console.log('True anomaly at time: ' + tat);

  const calcDisanceToCentral = (a, e, eat) => {
    return ( a * ( 1 - ( e * Math.cos(eat) ) ) );
  }

  const dist = calcDisanceToCentral(a, e, eat);
  // console.log('Distance to star (mill km): ' + dist / Math.pow(10, 9));

  // Positional vectors in orbital frame o(t)
  const x = dist * Math.cos(tat);
  const y = dist * Math.sin(tat);
  const z = 0;

  const planet = {
    name: name,
    objectRadius: 5,

    a: a, // semiMajorAxis a[m] (given)
    e: e, // eccentricity e[1] (given)
    b: b,
    focalShift: focalShift,
    w: w,
    lang: lang,
    inc: inc,
    maz: maz,
    epoch: epoch,

    x: x / Math.pow(10, 9),
    y: y / Math.pow(10, 9),
    z: z / Math.pow(10, 9),
  }
  return planet;
}

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  const render = renderer(document.getElementById('content'));

  // 1 AU = 150 million km
  let t = 0;

  while (t < 1000) {
    const planets = [];
    planets.push(makePlanet('planet1', 150, 0.6, t));
    planets.push(makePlanet('planet2', 200, 0, t));
    planets.push(makePlanet('planet3', 80, 0.8, t));
    render(draw.drawMap(planets));
    t += 1;
    await delay(100);
  }
  return;
}

window.onload = main;
