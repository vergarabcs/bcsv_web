import { useState } from 'react';

export interface TimeSlot {
  id: string;
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface Person {
  id: string;
  name: string;
  timeSlots: TimeSlot[];
}

export interface CommonTimeSlot {
  start: string;
  end: string;
  people: string[]; // Names of people available during this slot
}

export const useScheduleFinder = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPerson, setCurrentPerson] = useState<Person>({
    id: '',
    name: '',
    timeSlots: [],
  });

  // Add a new person with their availability
  const addPerson = (person: Person) => {
    setPeople((prev) => [...prev, person]);
  };

  // Remove a person
  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((person) => person.id !== id));
  };

  // Update a person's details
  const updatePerson = (updatedPerson: Person) => {
    setPeople((prev) =>
      prev.map((person) => 
        person.id === updatedPerson.id ? updatedPerson : person
      )
    );
  };

  // Convert time string (HH:MM) to minutes from midnight for easier comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes back to HH:MM format
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Find common time slots among all people
  const findCommonTimeSlots = (): CommonTimeSlot[] => {
    if (people.length === 0) return [];

    // Create time interval endpoints
    const endpoints: { time: number; isStart: boolean; personId: string }[] = [];
    
    people.forEach((person) => {
      person.timeSlots.forEach((slot) => {
        endpoints.push({
          time: timeToMinutes(slot.start),
          isStart: true,
          personId: person.id,
        });
        endpoints.push({
          time: timeToMinutes(slot.end),
          isStart: false,
          personId: person.id,
        });
      });
    });

    // Sort endpoints by time
    endpoints.sort((a, b) => a.time - b.time);

    const commonSlots: CommonTimeSlot[] = [];
    const activePersonIds = new Set<string>();
    let lastTime = -1;

    for (const endpoint of endpoints) {
      const currentTime = endpoint.time;
      
      // Check if all people are active and we have a valid start time
      if (lastTime !== -1 && activePersonIds.size === people.length) {
        commonSlots.push({
          start: minutesToTime(lastTime),
          end: minutesToTime(currentTime),
          people: people.map(p => p.name),
        });
      }

      // Update active people
      if (endpoint.isStart) {
        activePersonIds.add(endpoint.personId);
      } else {
        activePersonIds.delete(endpoint.personId);
      }

      lastTime = currentTime;
    }

    return commonSlots;
  };

  // Find overlapping time slots (where at least 2 people are available)
  const findOverlappingTimeSlots = (): CommonTimeSlot[] => {
    if (people.length < 2) return [];

    // Create time interval endpoints
    const endpoints: { time: number; isStart: boolean; personId: string; personName: string }[] = [];
    
    people.forEach((person) => {
      person.timeSlots.forEach((slot) => {
        endpoints.push({
          time: timeToMinutes(slot.start),
          isStart: true,
          personId: person.id,
          personName: person.name,
        });
        endpoints.push({
          time: timeToMinutes(slot.end),
          isStart: false,
          personId: person.id,
          personName: person.name,
        });
      });
    });

    // Sort endpoints by time
    endpoints.sort((a, b) => a.time - b.time);

    const overlapSlots: CommonTimeSlot[] = [];
    const activePersons = new Map<string, string>(); // id -> name
    let lastTime = -1;

    for (const endpoint of endpoints) {
      const currentTime = endpoint.time;
      
      // Check if we have at least 2 people active and we have a valid start time
      if (lastTime !== -1 && activePersons.size >= 2) {
        overlapSlots.push({
          start: minutesToTime(lastTime),
          end: minutesToTime(currentTime),
          people: Array.from(activePersons.values()),
        });
      }

      // Update active people
      if (endpoint.isStart) {
        activePersons.set(endpoint.personId, endpoint.personName);
      } else {
        activePersons.delete(endpoint.personId);
      }

      lastTime = currentTime;
    }

    return overlapSlots;
  };

  return {
    selectedDate,
    setSelectedDate,
    people,
    currentPerson,
    setCurrentPerson,
    addPerson,
    removePerson,
    updatePerson,
    findCommonTimeSlots,
    findOverlappingTimeSlots,
  };
};