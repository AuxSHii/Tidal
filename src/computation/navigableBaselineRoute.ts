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
  const nodes = generateNavigationGrid(
    start,
    end,
    spacing,
    paddingCells,
  )

  const navigableNodes = filterNavigableNodes(
    nodes,
    constraint,
  )

  const edges = buildNavigationGraph(
    navigableNodes,
    constraint,
    spacing,
  )

  const startNode = findNearestNode(
    start,
    navigableNodes,
  )

  const endNode = findNearestNode(
    end,
    navigableNodes,
  )

  return findShortestPath(
    navigableNodes,
    edges,
    startNode.id,
    endNode.id,
  )
}
