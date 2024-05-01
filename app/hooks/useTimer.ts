import { useEffect, useRef, useState } from "react";
import { DEFAULT_TIME } from "../constants";

export const useTimer = (
  onFinish: () => void,
  defaultRemainingTime?: number
) => {
  const timeOut = useRef<NodeJS.Timeout>();
  const [remainingTime, setRemainingTime] = useState<number>(defaultRemainingTime ?? DEFAULT_TIME);

  useEffect(() => {
    return () => {
      clearInterval(timeOut.current)
    }
  }, [])

  const startCountDown = () => {
    const startTime = Date.now()
    timeOut.current = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      let newRemainingTime = ((DEFAULT_TIME - elapsedTime))
      if(newRemainingTime <= 0){
        newRemainingTime = 0
        clearInterval(timeOut.current)
        onFinish()
      }
      setRemainingTime(newRemainingTime)
    }, 250)
  }

  return {
    startCountDown,
    remainingTime
  }
}