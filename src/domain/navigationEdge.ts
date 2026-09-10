import type { NavigationNode } from './navigationNode'

export interface NavigationEdge {
	from: NavigationNode
	to: NavigationNode
	cost: number
}