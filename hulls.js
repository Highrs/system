module.exports = {

  brick: () => ({
    class: 'Brick',
    cargoCap: 10,
    cargo: {},
    speed: 30,
    accel: 1,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    cargoCap: 15,
    cargo: {},
    speed: 25,
    accel: 0.6,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    cargoCap: 20,
    cargo: {},
    speed: 20,
    accel: 0.3,
    home: 'beta'
  })

};
