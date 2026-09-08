import type { Coordinate } from './coordinate'


//a boolean type dt for constr true or false ->  cord allowed or not!
export interface GeographicConstraint {
	contains(coordinate: Coordinate): boolean
}