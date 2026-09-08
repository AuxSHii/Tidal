//defined here units used
export function knotsToMetersPerSecond(knots: number): number {
	return knots * 0.514444
}
export function metersPerSecondToKnots(speed: number): number {
	return speed / 0.514444
}
export function nauticalMilesToMeters(nauticalMiles: number,): number {
	return nauticalMiles * 1852
}
export function metersToNauticalMiles(meters: number,): number {
	return meters / 1852
}
export function hoursToSeconds(hours: number): number {
 	return hours * 3600
}
export function secondsToHours(seconds: number): number {
 	return seconds / 3600
}
export function degreesToRadians(degrees: number): number {
	return degrees * (Math.PI /180)
}
export function radiansToDegrees(radians: number): number {
	return radians * (Math.PI /180)
}