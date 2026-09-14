import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { Route } from '../domain/route'
import { generateNavigationGrid } from './navigationGrid'
import { filterNavigableNodes } from './navigationNodes'
import { buildNavigationGraph } from './navigationGraph'
import { findShortestPath } from './navigationPath'
import { distanceBetween } from './geography'

function findNearestNode(
  coordinate: Coordinate,
  nodes: ReturnType<typeof filterNavigableNodes>,
) {
  if (nodes.length === 0) {
    throw new Error(
      'Cannot find nearest navigation node from an empty list',
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

export function generateNavigableBaselineRoute(
  start: Coordinate,
  end: Coordinate,
  constraint: GeographicConstraint,
  spacing: number = 10000,
  paddingCells: number = 5,
): Route | null {
  const gridStart = performance.now()

  const nodes = generateNavigationGrid(
    start,
    end,
    spacing,
    paddingCells,
  )

  const gridTime = performance.now() - gridStart

  const filteringStart = performance.now()

  const navigableNodes = filterNavigableNodes(
    nodes,
    constraint,
  )
console.log(
    'Geographic candidate count:',
    'getCandidateCount' in constraint &&
      typeof constraint.getCandidateCount === 'function'
      ? constraint.getCandidateCount()
      : 'unavailable',
  )

  console.log(
    'RBush time:',
    'getRbushTime' in constraint &&
      typeof constraint.getRbushTime === 'function'
      ? constraint.getRbushTime()
      : 'unavailable',
  )

  console.log(
    'Turf time:',
    'getTurfTime' in constraint &&
      typeof constraint.getTurfTime === 'function'
      ? constraint.getTurfTime()
      : 'unavailable',
  )

  const filteringTime =
    performance.now() - filteringStart

  const graphStart = performance.now()

  const edges = buildNavigationGraph(
    navigableNodes,
    constraint,
    spacing,
  )

  const graphTime = performance.now() - graphStart

  const nearestNodeStart = performance.now()

  const startNode = findNearestNode(
    start,
    navigableNodes,
  )

  const endNode = findNearestNode(
    end,
    navigableNodes,
  )

  const nearestNodeTime =
    performance.now() - nearestNodeStart

  const pathStart = performance.now()

  const route = findShortestPath(
    navigableNodes,
    edges,
    startNode.id,
    endNode.id,
  )

  const pathTime =
    performance.now() - pathStart

  console.log(
    'TIDAL navigation timing:',
    {
      grid: gridTime,
      filtering: filteringTime,
      graph: graphTime,
      nearestNodes: nearestNodeTime,
      shortestPath: pathTime,
      total:
        gridTime +
        filteringTime +
        graphTime +
        nearestNodeTime +
        pathTime,
    },
  )

  console.log(
    'Baseline route result:',
    route
      ? `Found (${route.points.length} points)`
      : 'No Route',
  )

  return route
}


