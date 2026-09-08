import type { Vessel } from '../domain/vessel'


export function travelTime(
  distance: number ,
  vessel: Vessel,
): number {
  if (distance < 0) {
    throw new Error('Distance cannot be negetive')
  }

  if (vessel.cruiseSpeed <= 0) {
    throw new Error('Vessel cruise speed must be greater than zero')
  }
  return distance / vessel.cruiseSpeed
}
