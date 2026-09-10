import { useEffect } from 'react'
import { fetchNaturalEarthLand } from './computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from './computation/naturalEarthConstraint'
import { evaluateNavigableBaselineRoute } from './computation/navigableBaselineRouteAnalysis'
import { defaultVessel } from './domain/vessels/defaultVessel'

function App() {
  useEffect(() => {
    async function testNavigableBaselineRoute() {
      const start = {
        longitude: 5.383,
        latitude: 0.007,
      }

      const end = {
        longitude: 8.0,
        latitude: 0.007,
      }

      const spacing = 10000

      const land = await fetchNaturalEarthLand()

      const constraint =
        new NaturalEarthLandConstraint(land)

      console.time(
        'navigable baseline route analysis',
      )

      const result =
        evaluateNavigableBaselineRoute(
          start,
          end,
          defaultVessel,
          constraint,
          spacing,
        )

      console.timeEnd(
        'navigable baseline route analysis',
      )

      if (result === null) {
        console.log(
          'No navigable route exists between the selected points.',
        )

        return
      }

      console.log(
        'Navigable baseline route:',
        result.route,
      )

      console.log(
        'Route points:',
        result.route.points.length,
      )

      console.log(
        'Distance:',
        result.metrics.distance,
        'm',
      )

      console.log(
        'Travel time:',
        result.metrics.travelTime,
        's',
      )

      console.log(
        'Energy:',
        result.metrics.energy,
        'J',
      )

      console.log(
        'Fuel mass:',
        result.metrics.fuelMass,
        'kg',
      )

      console.log(
        'Total RBush candidates:',
        constraint.getCandidateCount(),
      )

      console.log(
        'Total RBush time:',
        constraint.getRbushTime(),
        'ms',
      )

      console.log(
        'Total Turf time:',
        constraint.getTurfTime(),
        'ms',
      )
    }

    testNavigableBaselineRoute().catch(
      (error) => {
        console.error(
          'Navigable baseline route analysis failed:',
          error,
        )
      },
    )
  }, [])

  return <div>TIDAL</div>
}

export default App
