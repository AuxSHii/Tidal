import { useEffect } from 'react'
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'
import { fetchNaturalEarthLand } from './computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from './computation/naturalEarthConstraint'
import { pointInMultiPolygon } from './computation/pointInMultiPolygon'
import { pointInRing } from './computation/pointInRing'
import { pointInPolygon } from './computation/pointInPolygon'

function App() {
  // Temporary geography test
  useEffect(() => {
    async function runGeographyTest() {
      try {
        const rawResponse = await fetch(
          '/data/geography/natural-earth/land.geojson',
        )

        if (!rawResponse.ok) {
          throw new Error(
            `Failed to load Natural Earth data: ${rawResponse.status}`,
          )
        }

        const rawGeoJSON = await rawResponse.json()

        const rawTestPoint = {
          type: 'Point' as const,
          coordinates: [5.383, 0.007],
        }

        console.log(
          '--- RAW GEOJSON TEST ---',
        )

        for (const feature of rawGeoJSON.features) {
          if (
            feature.geometry.type === 'Polygon' ||
            feature.geometry.type === 'MultiPolygon'
          ) {
            const result =
              booleanPointInPolygon(
                rawTestPoint,
                feature,
              )

            console.log(
              'Raw feature:',
              feature.geometry.type,
              'contains 5.383,0.007:',
              result,
            )
          }
        }

        console.log(
          '--- LOADED GEOMETRY TEST ---',
        )

        const land =
          await fetchNaturalEarthLand()

        const constraint =
          new NaturalEarthLandConstraint(land)

        const polygon4 =
          land.polygons[4]

        console.log(
          'Polygon 4 longitude range:',
          Math.min(
            ...polygon4.outer.map(
              (point) => point.longitude,
            ),
          ),
          Math.max(
            ...polygon4.outer.map(
              (point) => point.longitude,
            ),
          ),
        )

        console.log(
          'Polygon 4 latitude range:',
          Math.min(
            ...polygon4.outer.map(
              (point) => point.latitude,
            ),
          ),
          Math.max(
            ...polygon4.outer.map(
              (point) => point.latitude,
            ),
          ),
        )

        console.log(
          'Polygon 4 outer points:',
          polygon4.outer.length,
        )

        const lastPolygon =
          land.polygons[
            land.polygons.length - 1
          ]

        console.log(
          'Last polygon outer points:',
          lastPolygon.outer.length,
        )

        console.log(
          'Last polygon holes:',
          lastPolygon.holes.length,
        )

        console.log(
          'Last polygon first points:',
          lastPolygon.outer.slice(0, 5),
        )

        for (
          let i = 0;
          i < land.polygons.length;
          i++
        ) {
          if (
            pointInPolygon(
              {
                latitude: 0,
                longitude: 10,
              },
              land.polygons[i],
            )
          ) {
            console.log(
              '0,10 matched polygon:',
              i,
            )
            break
          }
        }

        const testSquare = [
          { latitude: -1, longitude: -1 },
          { latitude: -1, longitude: 1 },
          { latitude: 1, longitude: 1 },
          { latitude: 1, longitude: -1 },
        ]

        console.log(
          'Square center:',
          pointInRing(
            {
              latitude: 0,
              longitude: 0,
            },
            testSquare,
          ),
        )

        console.log(
          'Outside square:',
          pointInRing(
            {
              latitude: 5,
              longitude: 5,
            },
            testSquare,
          ),
        )


console.log(
          'Point in land:',
          pointInMultiPolygon(
            {
              latitude: 0,
              longitude: 10,
            },
            land,
          ),
        )

        console.log(
          'Number of polygons:',
          land.polygons.length,
        )

        console.log(
          'Ocean allowed:',
          constraint.isAllowed({
            latitude: 0,
            longitude: 10,
          }),
        )

        console.log(
          'Land allowed:',
          constraint.isAllowed({
            latitude: 28.6,
            longitude: 77.2,
          }),
        )
      } catch (error) {
        console.error(
          'Geography test failed:',
          error,
        )
      }
    }

    runGeographyTest()
  }, [])

  return <div>TIDAL</div>
}

export default App