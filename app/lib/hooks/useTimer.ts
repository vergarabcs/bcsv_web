import { DEFAULT_TIME } from "@/app/constants";
import { useEffect, useRef, useState } from "react";

export const useTimer = (
  onFinish: () => void,
  defaultRemainingTime?: number
) => {
  const timeOut = useRef<NodeJS.Timeout>();
  const onFinishRef = useRef<Function>(onFinish);
  const [remainingTime, setRemainingTime] = useState<number>(defaultRemainingTime ?? DEFAULT_TIME);

  const [defaultStartTime, setStartTime] = useState<number>(defaultRemainingTime ?? DEFAULT_TIME)

  useEffect(() => {
    return () => {
      clearInterval(timeOut.current)
    }
  }, [])

  useEffect(() => {
    setStartTime(defaultRemainingTime ?? DEFAULT_TIME)
  }, [defaultRemainingTime])

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const startCountDown = () => {
    const startTime = Date.now()
    timeOut.current = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      let newRemainingTime = Math.round((defaultStartTime - elapsedTime))

      if(newRemainingTime <= 0){
        newRemainingTime = 0
        clearInterval(timeOut.current)
        onFinishRef.current()
      }
      setRemainingTime(newRemainingTime)
    }, 250)
  }

  return {
    startCountDown,
    remainingTime
  }
}