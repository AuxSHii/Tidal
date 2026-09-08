import type { Vessel } from '../vessel'

export const defaultVessel: Vessel = {
  name: 'TIDAL Development Vessel',            //my own palceholder dev vessel! SI UNITS

  length: 120,
  beam: 18,
  draft: 6,

  cruiseSpeed: 8,
  maxSpeed: 12,
  acceleration: 0.05,
  deceleration: 0.08,

  fuel: {
    name: 'Development Fuel',
    energyDensity: 42_000_000,

  },

  propulsion: {
    performanceCurve: [
      {
        speed: 4,
        power: 500_000,
      },
      {
        speed: 6,
        power: 1_000_000,
      },
      {
        speed: 8,
        power: 2_000_000,
      },
      {
        speed: 10,
        power: 4_000_000,
      },
      {
        speed: 12,
        power: 7_000_000,
      },
    ],

    efficiency: 0.4,
  },
}
