import { SessionContext } from "@/app/constants"
import { useContext, useState, useEffect, useMemo } from "react"
import { type Schema } from '@/amplify/data/resource'
import { PersonRangeRecord } from "./constants"
import { guardType } from "./guardType"
import { ampClient } from "../lib/amplifyClient"

// Storage keys for localStorage
const LOCAL_STORAGE_KEY_PREFIX = 'sf_offline_data_'
const OFFLINE_UPDATES_KEY = 'sf_offline_updates'

export const useSfData = () => {
  const { sessionId } = useContext(SessionContext)
  const [sfState, setSfState] = useState<Schema['ScheduleFinder']['type'] | null>(null)
  const _sfState = useMemo(() => guardType(sfState?.personRangeMap), [sfState?.personRangeMap])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  
  
  
  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load cached data from localStorage
  const loadFromLocalStorage = (id: string) => {
    try {
      const cachedData = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`)
      if (cachedData) {
        return JSON.parse(cachedData)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
    return null
  }

  // Save data to localStorage
  const saveToLocalStorage = (id: string, data: any) => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
    }
  }

  // Get pending offline updates
  const getPendingUpdates = () => {
    try {
      const updates = localStorage.getItem(OFFLINE_UPDATES_KEY)
      return updates ? JSON.parse(updates) : {}
    } catch (error) {
      console.error('Error getting pending updates:', error)
      return {}
    }
  }

  // Save pending offline update
  const savePendingUpdate = (id: string, personRangeMap: PersonRangeRecord) => {
    try {
      const pendingUpdates = getPendingUpdates()
      pendingUpdates[id] = personRangeMap
      localStorage.setItem(OFFLINE_UPDATES_KEY, JSON.stringify(pendingUpdates))
    } catch (error) {
      console.error('Error saving pending update:', error)
    }
  }

  // Remove pending update
  const removePendingUpdate = (id: string) => {
    try {
      const pendingUpdates = getPendingUpdates()
      if (pendingUpdates[id]) {
        delete pendingUpdates[id]
        localStorage.setItem(OFFLINE_UPDATES_KEY, JSON.stringify(pendingUpdates))
      }
    } catch (error) {
      console.error('Error removing pending update:', error)
    }
  }

  // Sync pending updates when online
  const syncPendingUpdates = async () => {
    if (isOffline || !sessionId) return
    
    try {
      const pendingUpdates = getPendingUpdates()
      
      if (pendingUpdates[sessionId]) {
        await ampClient.models.ScheduleFinder.update({
          id: sessionId,
          personRangeMap: JSON.stringify(pendingUpdates[sessionId])
        })
        removePendingUpdate(sessionId)
      }
    } catch (error) {
      console.error('Error syncing pending updates:', error)
    }
  }

  // Try to sync when coming back online
  useEffect(() => {
    if (!isOffline) {
      syncPendingUpdates()
    }
  }, [isOffline, sessionId])

  useEffect(() => {
    if (!sessionId) return

    // Check for cached data first
    const cachedData = loadFromLocalStorage(sessionId)
    if (cachedData) {
      setSfState(cachedData)
      if (isOffline) {
        setIsLoading(false)
      }
    }

    // If online, set up the observeQuery subscription
    if (!isOffline) {
      const subscription = ampClient.models.ScheduleFinder.observeQuery({
        filter: { id: { eq: sessionId } }
      }).subscribe({
        next: ({ items, isSynced }) => {
          if (items.length > 0) {
            const newState = items[0]
            setSfState(newState)
            // Cache the latest data
            saveToLocalStorage(sessionId, newState)
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
    }
  }, [sessionId, isOffline])

  // Function to update the ScheduleFinder data
  const updateSfState = async (personRangeMap: PersonRangeRecord) => {
    if (!sessionId) return

    try {
      // Create the updated state object - only update the personRangeMap property
      if (sfState) {
        // Update the existing state
        const updatedState = {
          ...sfState,
          personRangeMap: JSON.stringify(personRangeMap)
        }
        
        // Update local state immediately for responsive UI
        setSfState(updatedState)
        
        // Save to localStorage for offline access
        saveToLocalStorage(sessionId, updatedState)
        
        // If offline, save as pending update
        if (isOffline) {
          savePendingUpdate(sessionId, personRangeMap)
          return updatedState
        }
        
        // If online, update the remote state
        const updatedItem = await ampClient.models.ScheduleFinder.update({
          id: sessionId,
          personRangeMap: JSON.stringify(personRangeMap)
        })
        
        return updatedItem
      } else {
        // We're trying to update but don't have a current state
        // This might happen if we're offline when the page first loads
        const now = new Date().toISOString()
        const newState = {
          id: sessionId,
          personRangeMap: JSON.stringify(personRangeMap),
          createdAt: now,
          updatedAt: now
        } as Schema['ScheduleFinder']['type']
        
        // Update local state
        setSfState(newState)
        
        // Save to localStorage
        saveToLocalStorage(sessionId, newState)
        
        // If offline, save as pending update
        if (isOffline) {
          savePendingUpdate(sessionId, personRangeMap)
          return newState
        }
        
        // If online, create the item
        const createdItem = await ampClient.models.ScheduleFinder.create({
          id: sessionId,
          personRangeMap: JSON.stringify(personRangeMap)
        })
        
        return createdItem
      }
    } catch (error) {
      console.error('Error updating ScheduleFinder data:', error)
      
      // If there was an error (might be network related), save as pending update
      if (sessionId) {
        savePendingUpdate(sessionId, personRangeMap)
      }
      
      setError(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  return {
    sessionId,
    sfState: _sfState,
    setSfState: updateSfState,
    isLoading,
    error,
    isOffline
  }
}