import type { Coordinate } from '../coordinate'


export interface Polygon {
	outer: Coordinate[]
	holes: Coordinate[][]
}