export interface PerformancePoint {
    speed: number
    power: number

}

export interface PropulsionModel {
	performanceCurve: PerformancePoint[]
	efficiency: number
}