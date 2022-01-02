module.exports = {

  toDo: (clock = 0) => {return [
    clock,
    " ",
    "Unnamed System Project",
    " ",
    "Things that work:",
    "- 3D, 2-body Kepler orbits for all bodies (that innermost orbit is valid in 3D, but looks odd in 2D.);",
    "- Basic production of 3 resources on some bodies (but no one gets paid);",
    "- Basic logistics chain (ore -> metal -> parts);",
    "- Randomly generated asteroid belts (it was easier to make them this way);",
    "- 3 types of spacecraft (Brick, Boulder, Mountain);",
    "- Craft reserve, pick up, and drop off cargo down the logistics chain;",
    "- Variable acceleration with halfway breaking for spacecraft;",
    "- Intecept calculation for craft heading to planets.",
    "Things to be added in the immediate future:",
    "- Buttons to hide this list, planet information, hull IDs and cargo, range lines;",
    "- A pass to optimize (especially with drawing intercepts);",
    "- Invent capitalism (Buy and sell cost for resources);",
    "- Supply/demand-based cost drift;",
    "- Fuel consumption, production and refueling for craft;",
    "- Invent greed (Craft AI descision-making based on profit);",
    "- A nice lighting gradient from the sun.",
    "Things to be added in the non-immediate future:",
    "- Scrolling and zooming;",
    "- Nearby solar systems, FTL travel;",
    "- Human resources;",
    "- Profit-driven piracy and anti-piracy;",
    "- Overlay to show gravity wells.",
    "Bugs:",
    "- Planets keep producing when program is out of focus;",
    "- Craft can and will go through the sun;",
    "- Strange long tasks at random."
  ];},

  veryLiterateAndNescscessaryRefuelignCheckCheckList: () => {return [
    "Nozzle not inserted up-side down",
    "Refueling station has best price for fuel within travel distance",
    "Refueling station contains enough fuel",
    "GasolineFight variable = negative",
    "Refueling station actually carries correct type of fuel",
    "Fill nozzle is on correct side of ship when docked",
    "Captain has appropriate points card for this refueling station",
    "Cupon for this station in ship armor",
    "Gasoline station has self-service",
    "Gasoline station lacks self-defense",
    "Gasoline station is outside of fast-response range of navy assets",
    "Gasoline station has no navy craft refueling at it",
    "Gasoline station does not belong to warlord sponsor",
    "Station carries day-old hotdogs and scratch-off tickets"
  ];},

  keys: () => {return [
    "System Project V2.6a",
    "RMB + Drag to pan.",
    "Scroll to zoom."
  ];},

};
