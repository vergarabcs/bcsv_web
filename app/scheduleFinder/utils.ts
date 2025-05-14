import { CommonTimeSlot, PersonName, PersonRangeRecord } from "./constants";

export const findIntersections = (personRangeMap: PersonRangeRecord): CommonTimeSlot[] => {
  const allSlots: { time: Date; type: 'start' | 'end'; person: PersonName }[] = [];

  // Collect all start and end times with their respective person
  Object.values(personRangeMap).forEach(person => {
    person.availableSlots.forEach(slot => {
      allSlots.push({ time: slot.start, type: 'start', person: person.name });
      allSlots.push({ time: slot.end, type: 'end', person: person.name });
    });
  });

  // Sort by time, with 'end' before 'start' if times are equal
  allSlots.sort((a, b) => a.time.getTime() - b.time.getTime() || (a.type === 'end' ? -1 : 1));

  const activePeople = new Set<PersonName>();
  const intersections: CommonTimeSlot[] = [];

  for (let i = 0; i < allSlots.length - 1; i++) {
    const current = allSlots[i];
    const next = allSlots[i + 1];

    if (current.type === 'start') {
      activePeople.add(current.person);
    } else {
      activePeople.delete(current.person);
    }

    // If there are more than one active people and the next time is different, record the intersection
    if (activePeople.size > 1 && current.time.getTime() !== next.time.getTime()) {
      intersections.push({
        dtRange: {
          start: current.time,
          end: next.time,
        },
        people: Array.from(activePeople),
      });
    }
  }

  // Sort intersections by the number of people (descending)
  intersections.sort((a, b) => b.people.length - a.people.length);

  return intersections;
};
export const getDateAtHourToday = (hour: number): Date => {
  const now = new Date();
  now.setHours(hour, 0, 0, 0);
  return now;
};
