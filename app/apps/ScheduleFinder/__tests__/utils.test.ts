import { describe, expect, test } from "@jest/globals";
import { findIntersections } from "../utils";
import { CommonTimeSlot, Person, PersonName } from "../constants";

describe("findIntersections", () => {
  test("should return empty array when no persons provided", () => {
    const result = findIntersections({});
    expect(result).toEqual([]);
  });

  test("should find intersections between two people with overlapping slots", () => {
    const personRangeMap: Record<PersonName, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [
          { 
            start: new Date("2025-04-19T10:00:00Z"), 
            end: new Date("2025-04-19T12:00:00Z") 
          }
        ]
      },
      "2": {
        name: "Bob",
        availableSlots: [
          { 
            start: new Date("2025-04-19T11:00:00Z"), 
            end: new Date("2025-04-19T13:00:00Z") 
          }
        ]
      }
    };

    const expectedIntersection: CommonTimeSlot[] = [
      {
        dtRange: {
          start: new Date("2025-04-19T11:00:00Z"),
          end: new Date("2025-04-19T12:00:00Z")
        },
        people: ["Alice", "Bob"]
      }
    ];

    const result = findIntersections(personRangeMap);
    expect(result).toEqual(expectedIntersection);
  });

  test("should handle multiple time slots per person", () => {
    const personRangeMap: Record<string, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [
          { 
            start: new Date("2025-04-19T09:00:00Z"), 
            end: new Date("2025-04-19T11:00:00Z") 
          },
          { 
            start: new Date("2025-04-19T14:00:00Z"), 
            end: new Date("2025-04-19T16:00:00Z") 
          }
        ]
      },
      "2": {
        name: "Bob",
        availableSlots: [
          { 
            start: new Date("2025-04-19T10:00:00Z"), 
            end: new Date("2025-04-19T12:00:00Z") 
          },
          { 
            start: new Date("2025-04-19T15:00:00Z"), 
            end: new Date("2025-04-19T17:00:00Z") 
          }
        ]
      }
    };

    const result = findIntersections(personRangeMap);
    
    expect(result).toHaveLength(2);
    expect(result[0].people).toContain("Alice");
    expect(result[0].people).toContain("Bob");
    expect(result[0].dtRange.start).toEqual(new Date("2025-04-19T10:00:00Z"));
    expect(result[0].dtRange.end).toEqual(new Date("2025-04-19T11:00:00Z"));
    
    expect(result[1].people).toContain("Alice");
    expect(result[1].people).toContain("Bob");
    expect(result[1].dtRange.start).toEqual(new Date("2025-04-19T15:00:00Z"));
    expect(result[1].dtRange.end).toEqual(new Date("2025-04-19T16:00:00Z"));
  });

  test("should sort intersections by number of people in descending order", () => {
    const personRangeMap: Record<string, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [
          { 
            start: new Date("2025-04-19T10:00:00Z"), 
            end: new Date("2025-04-19T15:00:00Z") 
          }
        ]
      },
      "2": {
        name: "Bob",
        availableSlots: [
          { 
            start: new Date("2025-04-19T11:00:00Z"), 
            end: new Date("2025-04-19T14:00:00Z") 
          }
        ]
      },
      "3": {
        name: "Charlie",
        availableSlots: [
          { 
            start: new Date("2025-04-19T12:00:00Z"), 
            end: new Date("2025-04-19T13:00:00Z") 
          }
        ]
      }
    };

    const result = findIntersections(personRangeMap);
    
    // Should have 3 intersections
    expect(result).toHaveLength(3);
    
    // First intersection should have all 3 people
    expect(result[0].people).toHaveLength(3);
    expect(result[0].people).toContain("Alice");
    expect(result[0].people).toContain("Bob");
    expect(result[0].people).toContain("Charlie");
    expect(result[0].dtRange.start).toEqual(new Date("2025-04-19T12:00:00Z"));
    expect(result[0].dtRange.end).toEqual(new Date("2025-04-19T13:00:00Z"));
    
    // Second and third intersections should have 2 people each
    expect(result[1].people).toHaveLength(2);
    expect(result[2].people).toHaveLength(2);
  });

  test("should handle adjacent but non-overlapping time slots", () => {
    const personRangeMap: Record<string, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [
          { 
            start: new Date("2025-04-19T10:00:00Z"), 
            end: new Date("2025-04-19T12:00:00Z") 
          }
        ]
      },
      "2": {
        name: "Bob",
        availableSlots: [
          { 
            start: new Date("2025-04-19T12:00:00Z"), 
            end: new Date("2025-04-19T14:00:00Z") 
          }
        ]
      }
    };

    const result = findIntersections(personRangeMap);
    
    // Should have no intersections as the times are adjacent but don't overlap
    expect(result).toHaveLength(0);
  });

  test("should handle exact same time slots", () => {
    const sameTimeSlot = { 
      start: new Date("2025-04-19T10:00:00Z"), 
      end: new Date("2025-04-19T12:00:00Z") 
    };
    
    const personRangeMap: Record<string, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [sameTimeSlot]
      },
      "2": {
        name: "Bob",
        availableSlots: [sameTimeSlot]
      }
    };

    const result = findIntersections(personRangeMap);
    
    expect(result).toHaveLength(1);
    expect(result[0].people).toHaveLength(2);
    expect(result[0].dtRange.start).toEqual(sameTimeSlot.start);
    expect(result[0].dtRange.end).toEqual(sameTimeSlot.end);
  });

  test("Should handle within superset", () => {
    const personRangeMap: Record<string, Person> = {
      "1": {
        name: "Alice",
        availableSlots: [{ 
          start: new Date("2025-04-19T11:00:00Z"), 
          end: new Date("2025-04-19T12:00:00Z") 
        }]
      },
      "2": {
        name: "Bob",
        availableSlots: [{ 
          start: new Date("2025-04-19T10:00:00Z"), 
          end: new Date("2025-04-19T13:00:00Z") 
        }]
      }
    };
    const result = findIntersections(personRangeMap);
    expect(result).toHaveLength(1);
    expect(result[0].dtRange.start).toEqual(new Date("2025-04-19T11:00:00Z"));
    expect(result[0].dtRange.end).toEqual(new Date("2025-04-19T12:00:00Z"));
  })
});