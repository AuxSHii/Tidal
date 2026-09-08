import { speedAtTime , feasibleTargetSpeed, } from './computation/vesselMotion'
import { defaultVessel } from './domain/vessels/defaultVessel'

function App() {

console.log(
  'Acceleration:',
  speedAtTime(4, 8, 40, defaultVessel),
)

console.log(
  'Reached target:',
  speedAtTime(4, 8, 200, defaultVessel),
)

console.log(
  'Deceleration:',
  speedAtTime(8, 4, 40, defaultVessel),
)

console.log(
  'Feasible target:',
  feasibleTargetSpeed(20, defaultVessel),
)

console.log(
  'Impossible target motion:',
  speedAtTime(4, 20, 200, defaultVessel),
)



return <div>TIDAL</div>


}

export default App
