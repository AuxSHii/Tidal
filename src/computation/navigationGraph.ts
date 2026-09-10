import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { NavigationEdge } from '../domain/navigationEdge'
import type { NavigationNode } from '../domain/navigationNode'
import type { Route } from '../domain/route'
import { distanceBetween } from './geography'
import { validateRouteAgainstConstraint } from './geographicConstraint'

interface GridPosition {
  row: number
  column: number
}

function parseNodeId(id: string) {  //take id and return grid posn
  const match = /^grid-(\d+)-(\d+)$/.exec(id)

  if (!match) {
    throw new Error(`Invalid navigation grid node id: ${id}`)
  }

  return {
    row: Number(match[1]),
    column: Number(match[2]),
  }
}

function neighbourPositions(  //8 surrounding neigbour grid posn
  row: number,
  column: number,
): GridPosition[] {
  const positions: GridPosition[] = []

  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (
      let columnOffset = -1;
      columnOffset <= 1;
      columnOffset++
    ) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue
      }

      positions.push({
        row: row + rowOffset,
        column: column + columnOffset,
      })
    }
  }

  return positions
}

function edgeIsNavigable( //check edge againt cosntr
  from: NavigationNode,
  to: NavigationNode,
  constraint: GeographicConstraint,
  spacing: number,
  stats: {
    sampleCount: number
  },
): boolean {
  const route: Route = {
    points: [from.coordinate, to.coordinate],
  }

  return (
    validateRouteAgainstConstraint(
      route,
      constraint,
      spacing,
      stats,
    ) === null
  )
}

export function buildNavigationGraph(  //
  nodes: NavigationNode[],
  constraint: GeographicConstraint,
  spacing: number,
): NavigationEdge[] {
  const nodeMap = new Map<string, NavigationNode>()

  for (const node of nodes) {
    const position = parseNodeId(node.id)

    nodeMap.set(
      `${position.row}:${position.column}`,
      node,
    )
  }

  const edges: NavigationEdge[] = []

  // Count samples and validation time.
  const stats = {
    sampleCount: 0,
    validationTime: 0,
  }

  for (const node of nodes) {
    const position = parseNodeId(node.id)

    const neighbours = neighbourPositions(
      position.row,
      position.column,
    )

    for (const neighbour of neighbours) {
      const target = nodeMap.get(
        `${neighbour.row}:${neighbour.column}`,
      )

      if (!target) {
        continue
      }

      // Validate each physical connection only once.
      const isForward =
        neighbour.row > position.row ||
        (
          neighbour.row === position.row &&
          neighbour.column > position.column
        )

      if (!isForward) {
        continue
      }

      const validationStart = performance.now()

      const navigable = edgeIsNavigable(
        node,
        target,
        constraint,
        spacing,
        stats,
      )

      stats.validationTime +=
        performance.now() - validationStart

      if (!navigable) {
        continue
      }

      const cost = distanceBetween(
        node.coordinate,
        target.coordinate,
      )

      // Geography is symmetric, but edges stay directed.
      edges.push({
        from: node,
        to: target,
        cost,
      })

      edges.push({
        from: target,
        to: node,
        cost,
      })
    }
  }

  // Show total geographic samples after graph construction.
  console.log(
    'Total geographic samples:',
    stats.sampleCount,
  )

  // Show time spent checking geographic constraints.
  console.log(
    'Total geographic validation time:',
    stats.validationTime,
    'ms',
  )

  return edges
}
