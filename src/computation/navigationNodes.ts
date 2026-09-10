import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { NavigationNode } from '../domain/navigationNode'

export function filterNavigableNodes(nodes: NavigationNode[] , constraint: GeographicConstraint): NavigationNode[] {
	return nodes.filter((node) => 
	constraint.isAllowed(node.coordinate), )
}