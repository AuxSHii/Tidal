import type { NavigationEdge } from '../domain/navigationEdge'
import type { NavigationNode } from '../domain/navigationNode'
import type { Route } from '../domain/route'

export function findShortestPath(
  nodes: NavigationNode[],
  edges: NavigationEdge[],
  startNodeId: string,
  endNodeId: string,
): Route | null {
  const nodeMap = new Map<string, NavigationNode>()

  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  const adjacency = new Map<
    string,
    NavigationEdge[]
  >()

  for (const node of nodes) {
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    adjacency.get(edge.from.id)?.push(edge)
  }

  const distances = new Map<string, number>()
  const previous = new Map<string, string | null>()
  const unvisited = new Set<string>()

  for (const node of nodes) {
    distances.set(node.id, Infinity)
    previous.set(node.id, null)
    unvisited.add(node.id)
  }

  if (
    !nodeMap.has(startNodeId) ||
    !nodeMap.has(endNodeId)
  ) {
    throw new Error(
      'Start or end node does not exist in navigation graph',
    )
  }

  distances.set(startNodeId, 0)

  while (unvisited.size > 0) {
    let currentId: string | null = null
    let currentDistance = Infinity

    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Infinity

      if (distance < currentDistance) {
        currentDistance = distance
        currentId = nodeId
      }
    }

    if (currentId === null) {
      break
    }

    unvisited.delete(currentId)

    if (currentId === endNodeId) {
      break
    }

    const currentEdges =
      adjacency.get(currentId) ?? []

    for (const edge of currentEdges) {
      if (!unvisited.has(edge.to.id)) {
        continue
      }

      const currentDistanceValue =
        distances.get(currentId) ?? Infinity

      const newDistance =
        currentDistanceValue + edge.cost

      const knownDistance =
        distances.get(edge.to.id) ?? Infinity

      if (newDistance < knownDistance) {
        distances.set(edge.to.id, newDistance)
        previous.set(edge.to.id, currentId)
      }
    }
  }

  if (
    (distances.get(endNodeId) ?? Infinity) === Infinity
  ) {
    return null
  }

  const pathNodeIds: string[] = []
  let currentId: string | null = endNodeId

  while (currentId !== null) {
    pathNodeIds.push(currentId)
    currentId = previous.get(currentId) ?? null
  }

  pathNodeIds.reverse()

  return {
    points: pathNodeIds.map((nodeId) => {
      const node = nodeMap.get(nodeId)

      if (!node) {
        throw new Error(
          `Navigation node missing from graph: ${nodeId}`,
        )
      }

      return node.coordinate
    }),
  }
}
