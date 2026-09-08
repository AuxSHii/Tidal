import type { Vessel } from '../domain/vessel'
import { maximumPropulsionSpeed } from './propulsion'

export function clampVesselSpeed(
 requestedSpeed: number,
 vessel: Vessel,
): number {
 if (requestedSpeed < 0) {
  return 0
 }

 if (requestedSpeed > vessel.maxSpeed) {
  return vessel.maxSpeed
 }

 return requestedSpeed
}

// Function for maximum physically feasible speed.
export function maximumFeasibleSpeed(
 vessel: Vessel,
): number {
 const propulsionSpeed = maximumPropulsionSpeed(vessel)

 return Math.min(
  vessel.maxSpeed,
  propulsionSpeed,
 )
}

// Time required to change from one speed to another.
export function accelerationTime(
 initialSpeed: number,
 targetSpeed: number,
 vessel: Vessel,
): number {
 if (initialSpeed < 0) {
  throw new Error('Initial speed cannot be negative')
 }

 if (targetSpeed < 0) {
  throw new Error('Target speed cannot be negative')
 }

 if (vessel.acceleration <= 0) {
  throw new Error(
   'Vessel acceleration must be greater than zero',
  )
 }

 if (vessel.deceleration <= 0) {
  throw new Error(
   'Vessel deceleration must be greater than zero',
  )
 }

 const speedChange = Math.abs(
  targetSpeed - initialSpeed,
 )

 if (initialSpeed === targetSpeed) {
  return 0
 }

 if (initialSpeed < targetSpeed) {
  return speedChange / vessel.acceleration
 }

 return speedChange / vessel.deceleration
}

// Speed reached after a given amount of time while
// moving toward the target speed.
export function speedAtTime(
 initialSpeed: number,
 targetSpeed: number,
 time: number,
 vessel: Vessel,
): number {
 if (initialSpeed < 0) {
  throw new Error('Initial speed cannot be negative')
 }

 if (targetSpeed < 0) {
  throw new Error('Target speed cannot be negative')
 }

 if (time < 0) {
  throw new Error('Time cannot be negative')
 }

 if (vessel.acceleration <= 0) {
  throw new Error(
   'Vessel acceleration must be greater than zero',
  )
 }

 if (vessel.deceleration <= 0) {
  throw new Error(
   'Vessel deceleration must be greater than zero',
  )
 }

 const feasibleTarget =
  feasibleTargetSpeed(targetSpeed, vessel)

 if (initialSpeed === feasibleTarget) {
  return initialSpeed
 }

 if (initialSpeed < feasibleTarget) {
  const speed =
   initialSpeed +
   vessel.acceleration * time

  return Math.min(
   speed,
   feasibleTarget,
  )
 }

 const speed =
  initialSpeed -
  vessel.deceleration * time

 return Math.max(
  speed,
  feasibleTarget,
 )
}

// Returns the physically feasible version of a requested speed.
export function feasibleTargetSpeed(
 requestedSpeed: number,
 vessel: Vessel,
): number {
 if (requestedSpeed < 0) {
  throw new Error(
   'Requested speed cannot be negative',
  )
 }

 const maximumSpeed =
  maximumFeasibleSpeed(vessel)

 return Math.min(
  requestedSpeed,
  maximumSpeed,
 )
}

// Distance travelled while changing speed for a given time.
export function distanceAtTime(
 initialSpeed: number,
 targetSpeed: number,
 time: number,
 vessel: Vessel,
): number {
 if (initialSpeed < 0) {
  throw new Error('Initial speed cannot be negative')
 }

 if (targetSpeed < 0) {
  throw new Error('Target speed cannot be negative')
 }

 if (time < 0) {
  throw new Error('Time cannot be negative')
 }

 if (vessel.acceleration <= 0) {
  throw new Error(
   'Vessel acceleration must be greater than zero',
  )
 }

 if (vessel.deceleration <= 0) {
  throw new Error(
   'Vessel deceleration must be greater than zero',
  )
 }

 const feasibleTarget =
  feasibleTargetSpeed(targetSpeed, vessel)

 if (initialSpeed === feasibleTarget) {
  return initialSpeed * time
 }

 const totalChangeTime =
  accelerationTime(
   initialSpeed,
   feasibleTarget,
   vessel,
  )

 const effectiveTime =
  Math.min(time, totalChangeTime)

 if (initialSpeed < feasibleTarget) {
  return (
   initialSpeed * effectiveTime +
   0.5 *
    vessel.acceleration *
    effectiveTime *
    effectiveTime
  )
 }

 return (
  initialSpeed * effectiveTime -
  0.5 *
   vessel.deceleration *
   effectiveTime *
   effectiveTime
 )
}
// Distance required to change from one speed to another.
export function distanceForSpeedChange(
 initialSpeed: number,
 targetSpeed: number,
 vessel: Vessel,
): number {
 if (initialSpeed < 0) {
  throw new Error('Initial speed cannot be negative')
 }

 if (targetSpeed < 0) {
  throw new Error('Target speed cannot be negative')
 }

 if (vessel.acceleration <= 0) {
  throw new Error(
   'Vessel acceleration must be greater than zero',
  )
 }

 if (vessel.deceleration <= 0) {
  throw new Error(
   'Vessel deceleration must be greater than zero',
  )
 }

 if (initialSpeed === targetSpeed) {
  return 0
 }

 if (initialSpeed < targetSpeed) {
  return (
   (targetSpeed * targetSpeed -
    initialSpeed * initialSpeed) /
   (2 * vessel.acceleration)
  )
 }

 return (
  (initialSpeed * initialSpeed -
   targetSpeed * targetSpeed) /
  (2 * vessel.deceleration)
 )
}

// Maximum speed reachable over a given distance
// without exceeding the requested target speed.
export function maximumReachableSpeed(
 initialSpeed: number,
 targetSpeed: number,
 distance: number,
 vessel: Vessel,
): number {
 if (initialSpeed < 0) {
  throw new Error(
   'Initial speed cannot be negative',
  )
 }

 if (targetSpeed < 0) {
  throw new Error(
   'Target speed cannot be negative',
  )
 }

 if (distance < 0) {
  throw new Error(
   'Distance cannot be negative',
  )
 }

 if (vessel.acceleration <= 0) {
  throw new Error(
   'Vessel acceleration must be greater than zero',
  )
 }

 const feasibleTarget =
  feasibleTargetSpeed(targetSpeed, vessel)

 if (initialSpeed >= feasibleTarget) {
  return feasibleTarget
 }

 const reachableSpeed = Math.sqrt(
  initialSpeed * initialSpeed +
   2 *
    vessel.acceleration *
    distance,
 )

 return Math.min(
  reachableSpeed,
  feasibleTarget,
 )
}
