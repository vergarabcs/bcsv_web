export interface DateTimeRange {
  id?: string;
  start: Date;
  end: Date;
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