
import { useEffect } from 'react'
import { generateNavigationGrid } from './computation/navigationGrid'
import { filterNavigableNodes } from './computation/navigationNodes'
import { buildNavigationGraph } from './computation/navigationGraph'
import { findShortestPath } from './computation/navigationPath'
import { fetchNaturalEarthLand } from './computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from './computation/naturalEarthConstraint'
import { distanceBetween } from './computation/geography'
import type { Coordinate } from './domain/coordinate'
import type { NavigationNode } from './domain/navigationNode'

function findNearestNode(
  coordinate: Coordinate,
  nodes: NavigationNode[],
): NavigationNode {
  if (nodes.length === 0) {
    throw new Error(
      'Cannot find nearest node from an empty node list',
    )
  }

  let nearest = nodes[0]

  let nearestDistance = distanceBetween(
    coordinate,
    nearest.coordinate,
  )

  for (let i = 1; i < nodes.length; i++) {
    const distance = distanceBetween(
      coordinate,
      nodes[i].coordinate,
    )

    if (distance < nearestDistance) {
      nearest = nodes[i]
      nearestDistance = distance
    }
  }

  return nearest
}

function calculateRouteDistance(
  points: Coordinate[],
): number {
  let totalDistance = 0

  for (let i = 1; i < points.length; i++) {
    totalDistance += distanceBetween(
      points[i - 1],
      points[i],
    )
  }

  return totalDistance
}

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

      const startNode = findNearestNode(
        start,
        navigableNodes,
      )

      const endNode = findNearestNode(
        end,
        navigableNodes,
      )

      const route = findShortestPath(
        navigableNodes,
        edges,
        startNode.id,
        endNode.id,
      )

      console.log(
        'Total navigation nodes:',
        nodes.length,
      )

      console.log(
        'Navigable ocean nodes:',
        navigableNodes.length,
      )

      console.log(
        'Blocked land nodes:',
        nodes.length -
          navigableNodes.length,
      )

      console.log(
        'Navigation edges:',
        edges.length,
      )

      console.log(
        'Start navigation node:',
        startNode,
      )

      console.log(
        'End navigation node:',
        endNode,
      )

      console.log(
        'Shortest route:',
        route,
      )

      if (route) {
        const routeDistance =
          calculateRouteDistance(
            route.points,
          )

        console.log(
          'Route points:',
          route.points.length,
        )

        console.log(
          'Route distance:',
          routeDistance,
          'm',
        )
      } else {
        console.log(
          'No navigable route exists between the selected nodes.',
        )
      }



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

