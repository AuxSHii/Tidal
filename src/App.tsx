import { useEffect } from 'react'
import { generateNavigationGrid } from './computation/navigationGrid'
import { filterNavigableNodes } from './computation/navigationNodes'
import { buildNavigationGraph } from './computation/navigationGraph'
import { fetchNaturalEarthLand } from './computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from './computation/naturalEarthConstraint'
import type { Coordinate } from './domain/coordinate'

function App() {
  useEffect(() => {
    async function testNavigationGraph() {
      const start: Coordinate = {
        longitude: 5.383,
        latitude: 0.007,
      }

      const end: Coordinate = {
        longitude: 8.0,
        latitude: 0.007,
      }

      const spacing = 10000

      const land = await fetchNaturalEarthLand()

      const constraint =
        new NaturalEarthLandConstraint(land)

      const nodes = generateNavigationGrid(
        start,
        end,
        spacing,
        2,
      )

      const navigableNodes = filterNavigableNodes(
        nodes,
        constraint,
      )

      console.time('navigation graph build')

      const edges = buildNavigationGraph(
        navigableNodes,
        constraint,
        spacing,
      )

      console.timeEnd('navigation graph build')

      console.log(
        'Total navigation nodes:',
        nodes.length,
      )

      console.log(
        'Navigable ocean nodes:',
        navigableNodes.length,
      )

      console.log(
        'Navigation edges:',
        edges.length,
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

      console.log(
        'Sample edge:',
        edges[0],
      )
    }

    testNavigationGraph().catch((error) => {
      console.error(
        'Navigation graph test failed:',
        error,
      )
    })
  }, [])

  return <div>TIDAL</div>
}

export default App
