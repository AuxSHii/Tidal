import RBush from 'rbush'
import type { Polygon } from '../domain/geography/polygon'


// X = longitude
// Y = latitude
export interface IndexedLandPolygon {
    minX: number
    minY: number   //lat and lon bounds
    maxX: number
    maxY: number
    polygon: Polygon  //candidate polygon thats hould be returned
}

//fxn(polygons) --> candidate polygons + bounds
function boundingBox(polygon: Polygon): IndexedLandPolygon {
  const points = [   //array containing all co-ord of a polygon
      ...polygon.outer,   //unpack co-ord into new array
      ...polygon.holes.flat(),  //flat al hole array into the new arr
    ]
                        //first pt encountered
    let minX = Infinity  //start the smallst lat and longtude from +inf
    let minY = Infinity
    let maxX = -Infinity  //start the greatest lat and lon from -inf
    let maxY = -Infinity
     
    
    for ( const point of points ) {   //for every co-ord in polygon
      minX = Math.min(minX , point.longitude) //keep min of (current smalled lon/lat with this!)
        maxX = Math.max(maxX, point.longitude)
        minY = Math.min(minY , point.latitude)
        maxY = Math.max(maxY , point.latitude)
    }

    return {
      minX, minY , maxX , maxY , polygon,
    }

} 


export class LandSpatialIndex {  //
  private readonly index = new RBush<IndexedLandPolygon>()
  // rbush to store bound data

  private candidateCount = 0
  //total candidate polygons returned by RBush

  constructor(polygons: Polygon[]) {
    const items = polygons.map(boundingBox)

    this.index.load(items)
  }

  search(longitude: number, latitude: number): Polygon[] {
    const candidates = this.index.search({
      minX: longitude,
      minY: latitude,
      maxX: longitude,
      maxY: latitude,
    })

    this.candidateCount += candidates.length

    return candidates.map((item) => item.polygon)
  }

  getCandidateCount(): number {
    return this.candidateCount
  }
}
