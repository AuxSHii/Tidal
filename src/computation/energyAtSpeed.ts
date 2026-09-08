import type { Vessel } from '../domain/vessel'
import { powerAtSpeed } from './propulsion'
import { energyFromPower } from './energy'
import { speedAtTime } from './vesselMotion'
 
export function energyAtSpeed(speed: number , distance: number , vessel: Vessel,): number
{ 
	if (speed <= 0) {
		throw new Error('speed must be greater then zero')
	}

	if(distance <= 0){
		throw new Error('distance cannot be negetive')
	} 
    
    const power = powerAtSpeed(speed, vessel)
    const time = distance /speed  

    return energyFromPower(power, time)


}

export function energyDuringSpeedChange(   //placeholder fxn for propulsion energy when acc adn deacc
  initialSpeed: number,
  targetSpeed: number,
  time: number,
  vessel: Vessel,
): number {
  if (time < 0) {
    throw new Error('Time cannot be negative')
  }

  const speed = speedAtTime(
    initialSpeed,
    targetSpeed,
    time,
    vessel,
  )

  const initialPower =
    powerAtSpeed(initialSpeed, vessel)

  const finalPower =
    powerAtSpeed(speed, vessel)

  const averagePower =
    (initialPower + finalPower) / 2

  return energyFromPower(
    averagePower,
    time,
  )
}


