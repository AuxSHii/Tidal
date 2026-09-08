import type { Coordinate } from '../domain/coordinate'
import type { Polygon } from '../domain/geography/polygon'
import type { MultiPolygon } from '../domain/geography/multiPolygon'

interface GeoJSONFeature {     //data geting from GeoJSON
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: unknown       
  }
}

interface GeoJSONFeatureCollection { // high lvl geojson info
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

function coordinateFromGeoJSON(     //getin co-ord from geojson! convt into tidal dt co-ord
  coordinate: unknown,
): Coordinate {
  if (
    !Array.isArray(coordinate) ||         // reject invalid cord-not lat or lon
    coordinate.length < 2 ||
    typeof coordinate[0] !== 'number' ||
    typeof coordinate[1] !== 'number'
  ) {
    throw new Error(
      'Invalid GeoJSON coordinate',
    )
  }

  return {
    longitude: coordinate[0],
    latitude: coordinate[1],
  }
}

function polygonFromGeoJSON(  //convt raw polygon from geojson to tidal dt polygon
  coordinates: unknown,
): Polygon {
  if (!Array.isArray(coordinates)) {   // checkin polygon has cord array 
    throw new Error(
      'Invalid GeoJSON polygon coordinates',
    )
  }

  const rings = coordinates.map(
    (ring) => {
      if (!Array.isArray(ring)) {    
        throw new Error(
          'Invalid GeoJSON polygon ring',
        )
      }

      return ring.map(          //give ring
        coordinateFromGeoJSON,
      )
    },
  )

  if (rings.length === 0) {   //polygn w/o ring = no use
    throw new Error(
      'GeoJSON polygon has no rings',
    )
  }

  return {
    outer: rings[0],        
    holes: rings.slice(1),
  }
}

export function loadNaturalEarthLand(
  data: unknown,                   //returning tidal multipolygon
): MultiPolygon {
  const collection =
    data as GeoJSONFeatureCollection         //importing data

  if (
    collection.type !==
    'FeatureCollection'
  ) {
    throw new Error(
      'Natural Earth data must be a GeoJSON FeatureCollection',
    )
  }

  const polygons: Polygon[] = []

  for (const feature of collection.features) {
    if (!feature.geometry) {
      throw new Error(
        'GeoJSON feature is missing geometry',
      )
    }

    if (
      feature.geometry.type ===
      'Polygon'
    ) {
      polygons.push(                    //process every feature
        polygonFromGeoJSON(
          feature.geometry.coordinates,
        ),
      )
    } else if (
      feature.geometry.type ===
      'MultiPolygon'
    ) {
      if (
        !Array.isArray(
          feature.geometry.coordinates,
        )
      ) {
        throw new Error(
          'Invalid GeoJSON MultiPolygon coordinates',
        )
      }

      for (
        const polygonCoordinates
        of feature.geometry.coordinates
      ) {
        polygons.push(
          polygonFromGeoJSON(
            polygonCoordinates,
          ),
        )
      }
    } else {
      throw new Error(
        'Unsupported Natural Earth geometry type',
      )
    }
  }

  return {
    polygons,
  }
}


//fxn to fetch the geojson file

export async function 
fetchNaturalEarthLand(): Promise<MultiPolygon> {
  const response = await fetch('/data/geography/natural-earth/land.geojson',)

  if( !response.ok ) {
    throw new Error(`Failed to load Natural Earth data: ${response.status} `,)
  }


  const data: unknown = await response.json()

   
  return loadNaturalEarthLand(data)
}
