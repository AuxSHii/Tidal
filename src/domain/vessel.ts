
import type { PropulsionModel } from './propulsion'
import type { FuelModel } from './fuel'





export interface Vessel {
	name: string

	length: number
	beam: number
	draft: number

	cruiseSpeed: number
	maxSpeed: number
	acceleration: number
	deceleration: number

	propulsion: PropulsionModel
	fuel: FuelModel
}