import { useState } from 'react';
import { v4 } from 'uuid';
import { CommonTimeSlot, DateTimeRange, Person, PersonName, PersonRangeRecord } from './constants';
import { findIntersections } from './utils';

export const useScheduleFinder = (scheduleFinderId: string) => {
  const [personRangeMap, setPersonRangeMap] = useState<PersonRangeRecord>({});
  const intersections: CommonTimeSlot[] = findIntersections(personRangeMap)

  const addPerson = (name: PersonName) => {
    if(personRangeMap[name]) return false;
    setPersonRangeMap({
      ...personRangeMap,
      [name]: {
        name: name,
        availableSlots: []
      }
    })
    return true;
  }

  const addRange = (name: PersonName) => {
    if(!personRangeMap[name]) return false;
    const newRange: DateTimeRange = {
      id: v4(),
      start: new Date(),
      end: new Date()
    }

    setPersonRangeMap({
      ...personRangeMap,
      [name]: {
        ...personRangeMap[name],
        availableSlots: [
          ...personRangeMap[name].availableSlots,
          newRange
        ]
      }
    })
    return true;
  }

  const removeRange = (name: PersonName, id: string) => {
    if (!personRangeMap[name]) return false;

    setPersonRangeMap({
      ...personRangeMap,
      [name]: {
        ...personRangeMap[name],
        availableSlots: personRangeMap[name].availableSlots.filter(slot => slot.id !== id)
      }
    });
    return true;
  }

  const setDate = (name: PersonName, id: string, boundName: 'start' | 'end', date: Date) => {
    if (!personRangeMap[name]) return false;

    setPersonRangeMap({
      ...personRangeMap,
      [name]: {
        ...personRangeMap[name],
        availableSlots: personRangeMap[name].availableSlots.map(slot => 
          slot.id === id ? { ...slot, [boundName]: date } : slot
        )
      }
    });
    return true;
  };

  const removePerson = (name: PersonName) => {
    const newRangeMap = {
      ...personRangeMap
    }
    delete newRangeMap[name]
    setPersonRangeMap(newRangeMap)
  }
  
  return {
    personRangeMap,
    addPerson,
    removePerson,
    addRange,
    setDate,
    removeRange,
    intersections
  };
};