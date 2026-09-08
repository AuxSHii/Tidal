export function energyFromPower(   //fxn takes powrr and time to give energy
  power: number,
  time: number,
): number {
  if (power < 0) {
    throw new Error('Power cannot be negative')
  }

  if (time < 0) {
    throw new Error('Time cannot be negative')
  }

  return power * time
}