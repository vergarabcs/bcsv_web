export interface DateTimeRange {
  id?: string;
  start: Date; // HH:MM format
  end: Date; // HH:MM format
}

export type PersonName = string;

export interface Person {
  name: PersonName;
  availableSlots: DateTimeRange[];
}

export interface CommonTimeSlot {
  dtRange: DateTimeRange;
  people: PersonName[]; // Names of people available during this slot
}

export type PersonRangeRecord = Record<PersonName, Person>