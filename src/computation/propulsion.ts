import type { Vessel } from '../domain/vessel'

export function powerAtSpeed(
  speed: number,
  vessel: Vessel,
): number {
  const curve = vessel.propulsion.performanceCurve

  if (curve.length === 0) {
    throw new Error('Performance curve cannot be empty')
  }

  if (
    speed < curve[0].speed ||
    speed > curve[curve.length - 1].speed
  ) {
    throw new Error(
      'Speed is outside the performance curve range',
    )
  }

  for (let i = 0; i < curve.length - 1; i++) {
    const lower = curve[i]
    const upper = curve[i + 1]

    if (speed >= lower.speed && speed <= upper.speed) {
      const fraction =
        (speed - lower.speed) /
        (upper.speed - lower.speed)

      return (
        lower.power +
        fraction * (upper.power - lower.power)
      )
    }
  }

  return curve[curve.length - 1].power
}



/* 
algorithm for finding power from speed having a perf.curve -

1.fxn takes speed and vessel adn return the power with the help of performace curve in vessel
2.validate the speed range 0 to maxspeed
3.get curve=array of(power,speed) from GIVEN vessel.propulsion.performanceCurve
   curve stored in dt vessel'sproperty propulsion - its an array of power pts i.e. (power , speed)
4.loop over entire array=curve=(power,speed)
5.finding out upper and lower pt of target perf-pt. by given speed
6.calc power for  (power,given_speed) pt. by linear interpolation formaula as we know its upper and lower point.propulsion
7.return the power
8.return the powers! of entire array /curve
*/

export function maximumPropulsionSpeed(vessel: Vessel): number {  //fxn takes vessel (perfcurve) then returns max performance speed

  const curve = vessel.propulsion.performanceCurve
  if(curve.length === 0) {
    throw new Error('performace curve cannot be empty')
  }

  return curve[curve.length - 1].speed  //returning last pt. speed->max [as curve is ordered]
}