import { SessionContext } from "@/app/constants"
import { useContext, useState, useEffect, useMemo } from "react"
import { generateClient } from 'aws-amplify/api'
import { type Schema } from '@/amplify/data/resource'
import { PersonRangeRecord } from "./constants"
import { guardType } from "./guardType"

export const useSfData = () => {
  const { sessionId } = useContext(SessionContext)
  const [sfState, setSfState] = useState<Schema['ScheduleFinder']['type'] | null>(null)
  const _sfState = useMemo(() => guardType(sfState?.personRangeMap), [sfState?.personRangeMap])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const client = generateClient<Schema>()

  useEffect(() => {
    if (!sessionId) return

    // Set up the observeQuery subscription for real-time updates
    const subscription = client.models.ScheduleFinder.observeQuery({
      filter: { id: { eq: sessionId } }
    }).subscribe({
      next: ({ items, isSynced }) => {
        if (items.length > 0) {
          setSfState(items[0])
        }
        if (isSynced) {
          setIsLoading(false)
        }
      },
      error: (error: Error) => {
        console.error('Subscription error:', error)
        setError(error)
        setIsLoading(false)
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [sessionId])

  // Function to update the ScheduleFinder data
  const updateSfState = async (personRangeMap: PersonRangeRecord) => {
    if (!sessionId || !sfState) return

    try {
      const updatedItem = await client.models.ScheduleFinder.update({
        id: sessionId,
        personRangeMap: JSON.stringify(personRangeMap)
      })
      
      // The state will be updated automatically through the subscription
      return updatedItem
    } catch (error) {
      console.error('Error updating ScheduleFinder data:', error)
      setError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  return {
    sessionId,
    sfState: _sfState,
    setSfState: updateSfState,
    isLoading,
    error
  }
}