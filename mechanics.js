'use strict';
//The comments might all lies, don't trust them.

const cos   = Math.cos;
const sin   = Math.sin;
const PI    = Math.PI;
const sqrt  = Math.sqrt;

const kepCalc = (bodyo, time = bodyo.t, mode = 'n', mat  = 0) => {
  if(!bodyo){throw 'kepCalc() err: no bodyo given.';}

  let primaryo = bodyo.primaryo;

  let a    = bodyo.a;    // semi-major axis (a)
  let e    = bodyo.e;    // eccentricity (e)
  let t0   = bodyo.t0;   // epoch (days) (t0)
  let w    = bodyo.w;    // argument of periapsis (w)
  let lang = bodyo.lang; // longitude of ascention node (lang)
  let inc  = bodyo.inc;  // inclanation (inc)
  let maz  = bodyo.maz;
  // let focalShift = 0;
  // let maz  = bodyo.maz;  // mean anomaly at zero (maz)
  // time (days) (t)

  let itter = 1; //Number of itterations to run for solution
  // 1 intteration appears to be enough, and entirely functional
  // Look out for errors caused by inaccuracy due to low itter.
  // if (bodyo.type == 'asteroid') {
  //   itter = 1;
  // }

  const calcMAT = () => {
    a = a * (10 ** 9);
    const g = 6.674 * (10 ** -11); // Gravitational constant G
    const mass = primaryo.mass * (10 ** 20); // Central object mass, approximately sol
    const u = g * mass; // Standard gravitational parameter u

    // const calcMinorAxis = (a, e) => {return ( a * sqrt(1 - e * e) );};
    // const b = (calcMinorAxis(a, e)); // minorAxis b[m]

    // distance of focus from center
    // focalShift = ( sqrt((a ** 2) - (b ** 2)) );

    // const epoch = t0; //epoch (given) (days)

    let tdiff = ( 86400 * ( time - t0 ) );
    mat = maz + ( tdiff * sqrt( u / (a ** 3) ) );
    while (mat < 0) {
      mat += PI * 2;
    }
    mat = mat % (PI * 2);
    // console.log(mat);
  };

  if (mode === 'n') {calcMAT();} // Mean Anomaly at Time

  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)


  let eat = mat;
  for (let i = 0; i < itter; i++) {
    eat = eat - ( (eat - ( e * sin(eat) ) - mat) / ( 1 - e * cos(eat) ) );
  }

  const tat = ( 2 * Math.atan2(
    ( sqrt(1 + e) * sin(eat / 2) ),
    ( sqrt(1 - e) * cos(eat / 2) )
  ) );

  const dist = ( a * ( 1 - ( e * cos(eat) ) ) );

  // Positional vectors in orbital frame o(t)
  const ox = dist * cos(tat);
  const oy = dist * sin(tat);
  // const oz = 0;

  const x = ( ox * ( (cos(w) * cos(lang)) - (sin(w) * cos(inc) * sin(lang)) )
    - oy * ( (sin(w) * cos(lang)) + (cos(w) * cos(inc) * sin(lang)) ) );
  const y = ( ox * ( (cos(w) * sin(lang)) + (sin(w) * cos(inc) * cos(lang)) )
    + oy * ( (cos(w) * cos(inc) * cos(lang)) - (sin(w) * sin(lang)) ) );
  const z = ( ox * ( sin(w) * sin(inc) ) + oy * ( cos(w) * sin(inc) ) );

  let bodyCoords = {
    x: x,
    y: y,
    z: z
  };

  if (mode === 'n') {
    ['x', 'y', 'z'].forEach(e => {
      bodyCoords[e] = bodyCoords[e] / (10 ** 9);
    });
  }

  let primaryCoords = {};

  if (primaryo.type !== 'star') {
    primaryCoords = kepCalc(primaryo, time);
  } else {
    primaryCoords = {
      x: primaryo.x,
      y: primaryo.y,
      z: primaryo.z
    };
  }

  return {
    // Cooridnates with origin on star
    x: bodyCoords.x + primaryCoords.x,
    y: bodyCoords.y + primaryCoords.y,
    z: bodyCoords.z + primaryCoords.z,
    // Coordinates of primary
    px: primaryo.x,
    py: primaryo.y,
    pz: primaryo.z,
    // Adjusted with origin on primary
    ax: bodyCoords.x,
    ay: bodyCoords.y,
    az: bodyCoords.z,

    // focalShift: focalShift
  };
};
const calcDist = (body1, body2) => {
  return sqrt(
            ( (body1.x - body2.x) ** 2 )
          + ( (body1.y - body2.y) ** 2 )
          + ( (body1.z - body2.z) ** 2 ) );
};
const calcDistSq = (body1, body2) => {
  return (  ( (body1.x - body2.x) ** 2 )
          + ( (body1.y - body2.y) ** 2 )
          + ( (body1.z - body2.z) ** 2 )
         );
};
const calcTravelTime = (dist, accel) => {
  return sqrt( dist / accel ) * 2;
};

exports.kepCalc = kepCalc;
exports.calcDist = calcDist;
exports.calcDistSq = calcDistSq;
exports.calcTravelTime = calcTravelTime;
