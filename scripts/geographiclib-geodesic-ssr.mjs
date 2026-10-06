import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const geographiclib = require('geographiclib-geodesic')

export const Constants = geographiclib.Constants
export const Math = geographiclib.Math
export const Accumulator = geographiclib.Accumulator
export const Geodesic = geographiclib.Geodesic
export const GeodesicLine = geographiclib.GeodesicLine
export const PolygonArea = geographiclib.PolygonArea
