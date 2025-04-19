import { useScheduleFinder } from "./useScheduleFinder"
import styles from './scheduleFinder.module.css'

const ScheduleFinder = () => {
  const {
    addPerson,
    addRange,
    intersections,
    personRangeMap,
    removeRange,
    setDate
  } = useScheduleFinder();

  return <div></div>
}

export default ScheduleFinder