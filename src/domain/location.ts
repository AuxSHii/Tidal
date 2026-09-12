import type { Coordinate } from './coordinate'

export type LocationSource = 
    | 'map'
    | 'coordinates'
    | 'search'

export interface Location {
	coordinate: Coordinate
	name?: String
	source: LocationSource
}