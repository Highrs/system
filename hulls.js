module.exports = {

  brick: () => ({
    class: 'Brick',
    cargoCap: 10,
    // speed: 30,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    cargoCap: 20,
    // speed: 25,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    cargoCap: 30,
    // speed: 20,
    accel: 1,
    home: 'beta'
  })

};
