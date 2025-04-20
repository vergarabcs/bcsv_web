import { PersonRangeRecord, Person, DateTimeRange } from './constants';

/**
 * Type guard function for PersonRangeRecord
 * Returns the object as PersonRangeRecord if valid, or undefined if invalid
 */
export const guardType = (someObject: unknown): PersonRangeRecord | undefined => {
  if (!someObject || typeof someObject !== 'object' || someObject === null) {
    return undefined;
  }
  
  const record = someObject as Record<string, unknown>;
  
  // Check if each key maps to a valid Person object
  for (const personName in record) {
    const person = record[personName];
    
    // Check if person is an object
    if (!person || typeof person !== 'object' || Array.isArray(person)) {
      return undefined;
    }
    
    const personObj = person as Partial<Person>;
    
    // Check person has name property
    if (typeof personObj.name !== 'string') {
      return undefined;
    }
    
    // Check person has availableSlots array
    if (!Array.isArray(personObj.availableSlots)) {
      return undefined;
    }
    
    // Validate each availability slot
    for (const slot of personObj.availableSlots) {
      if (!isDateTimeRange(slot)) {
        return undefined;
      }
    }
  }
  
  // If all checks pass, return the object as PersonRangeRecord
  return someObject as PersonRangeRecord;
};

/**
 * Helper function to validate if an object is a DateTimeRange
 */
const isDateTimeRange = (obj: unknown): obj is DateTimeRange => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  const rangeObj = obj as Partial<DateTimeRange>;
  
  // Check if start and end are Date objects or can be converted to Date objects
  const hasValidStart = rangeObj.start instanceof Date || 
                        (typeof rangeObj.start === 'string' && !isNaN(new Date(rangeObj.start).getTime()));
  
  const hasValidEnd = rangeObj.end instanceof Date || 
                      (typeof rangeObj.end === 'string' && !isNaN(new Date(rangeObj.end).getTime()));
  
  return hasValidStart && hasValidEnd;
};