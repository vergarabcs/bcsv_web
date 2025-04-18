import { useEffect, useRef } from "react"

export const useAsyncEffectOnce = (
  effect: () => Promise<void>
) => {
  const hasRun = useRef<boolean>();
  useEffect(() => {
    if(hasRun.current) return;
    hasRun.current = true;
    effect()
  }, [])
}