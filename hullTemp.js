module.exports = {

  brick: () => ({
    class: 'Brick',
    abr: 'BRK',
    type: 'freighter',
    cargoCap: 10,
    fuelCapacity: 10,
    fuelConsumption: 0.1,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    abr: 'BLD',
    type: 'freighter',
    cargoCap: 20,
    fuelCapacity: 20,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    abr: 'MNT',
    type: 'freighter',
    cargoCap: 30,
    fuelCapacity: 30,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  barlog: () => ({
    class: 'Barlog',
    abr: 'BRL',
    type: 'freighter',
    cargoCap: 40,
    fuelCapacity: 40,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  arrow: () => ({
    class: 'Arrow',
    abr: 'ARR',
    type: 'combat',
    cargoCap: 1,
    fuelCapacity: 50,
    fuelConsumption: 0.1,
    accel: 5,
    home: 'astroDeltaB'
  }),

  menace: () => ({
    class: 'Menace',
    abr: 'MNC',
    type: 'combat',
    cargoCap: 2,
    fuelCapacity: 50,
    fuelConsumption: 0.1,
    accel: 5,
    home: 'astroDeltaB'
  })

};
