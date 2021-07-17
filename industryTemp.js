module.exports = {

  mining: () => ({
    name: 'Mining',
    abr: 'MNG',
    cycle: 1,
    input: {},
    output: {
      ore: 1
    }
  }),

  refining: () => ({
    name: 'Refining',
    abr: 'REF',
    cycle: 5,
    input: {
      ore: 10
    },
    output: {
      metal: 1
    }
  }),

  factory: () => ({
    name: 'Factory',
    abr: 'FRY',
    cycle: 10,
    input: {
      metal: 5
    },
    output: {
      parts: 1
    }
  }),

  gasStation: () => ({
    name: 'Gas Station',
    abr: 'GAS',
    cycle: 1,
    input: {},
    output: {
      fuel: 10
    }
  })

};
