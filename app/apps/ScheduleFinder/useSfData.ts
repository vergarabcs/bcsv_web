import { SessionContext } from "@/app/constants"
import { useContext, useState, useEffect } from "react"
import { generateClient } from 'aws-amplify/api'
import { type Schema } from '@/amplify/data/resource'
import { PersonRangeRecord } from "./constants"
import { guardType } from "./guardType"

export const useSfData = () => {
  const { sessionId: scheduleFinderId } = useContext(SessionContext)
  const [sfState, setSfState] = useState<Schema['ScheduleFinder']['type'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const client = generateClient<Schema>()

  useEffect(() => {
    if (!scheduleFinderId) return

    // Set up the observeQuery subscription for real-time updates
    const subscription = client.models.ScheduleFinder.observeQuery({
      filter: { id: { eq: scheduleFinderId } }
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
  }, [scheduleFinderId])

  // Function to update the ScheduleFinder data
  const updateSfState = async (personRangeMap: PersonRangeRecord) => {
    if (!scheduleFinderId || !sfState) return
    
    try {
      const updatedItem = await client.models.ScheduleFinder.update({
        id: scheduleFinderId,
        personRangeMap: personRangeMap
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
    sfState: guardType(sfState?.personRangeMap),
    setSfState: updateSfState,
    isLoading,
    error
  }
}