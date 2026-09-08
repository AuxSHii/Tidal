export interface speedPhase { 
   
   initialSpeed: number
   finalSpeed: number
   distance: number
   time: number
 }

export interface SpeedProfile { 
    acceleration: speedPhase
    cruise: speedPhase
    deceleration: speedPhase
    totalDistance: number
    totalTime: number

}