import { describe, expect, test } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useScheduleFinder } from '../useScheduleFinder';

describe('useScheduleFinder', () => {
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    expect(result.current.selectedDate).toBeInstanceOf(Date);
    expect(result.current.people).toEqual([]);
    expect(result.current.currentPerson).toEqual({
      id: '',
      name: '',
      timeSlots: [],
    });
  });

  test('should add a person', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const person = {
      id: '1',
      name: 'John',
      timeSlots: [
        { id: 'ts1', start: '09:00', end: '10:00' },
      ],
    };
    
    act(() => {
      result.current.addPerson(person);
    });
    
    expect(result.current.people).toHaveLength(1);
    expect(result.current.people[0]).toEqual(person);
  });

  test('should remove a person', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const person1 = {
      id: '1',
      name: 'John',
      timeSlots: [{ id: 'ts1', start: '09:00', end: '10:00' }],
    };
    
    const person2 = {
      id: '2',
      name: 'Jane',
      timeSlots: [{ id: 'ts2', start: '10:00', end: '11:00' }],
    };
    
    act(() => {
      result.current.addPerson(person1);
      result.current.addPerson(person2);
    });
    
    expect(result.current.people).toHaveLength(2);
    
    act(() => {
      result.current.removePerson('1');
    });
    
    expect(result.current.people).toHaveLength(1);
    expect(result.current.people[0]).toEqual(person2);
  });

  test('should update a person', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const person = {
      id: '1',
      name: 'John',
      timeSlots: [{ id: 'ts1', start: '09:00', end: '10:00' }],
    };
    
    act(() => {
      result.current.addPerson(person);
    });
    
    const updatedPerson = {
      ...person,
      name: 'John Smith',
      timeSlots: [
        ...person.timeSlots,
        { id: 'ts2', start: '14:00', end: '15:00' }
      ],
    };
    
    act(() => {
      result.current.updatePerson(updatedPerson);
    });
    
    expect(result.current.people).toHaveLength(1);
    expect(result.current.people[0]).toEqual(updatedPerson);
  });

  test('should find common time slots when all people are available', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const person1 = {
      id: '1',
      name: 'John',
      timeSlots: [
        { id: 'ts1', start: '09:00', end: '11:00' },
        { id: 'ts2', start: '14:00', end: '16:00' },
      ],
    };
    
    const person2 = {
      id: '2',
      name: 'Jane',
      timeSlots: [
        { id: 'ts3', start: '10:00', end: '12:00' },
        { id: 'ts4', start: '14:30', end: '17:00' },
      ],
    };
    
    act(() => {
      result.current.addPerson(person1);
      result.current.addPerson(person2);
    });
    
    const commonSlots = result.current.findCommonTimeSlots();
    
    expect(commonSlots).toHaveLength(2);
    expect(commonSlots[0]).toEqual({
      start: '10:00',
      end: '11:00',
      people: ['John', 'Jane'],
    });
    expect(commonSlots[1]).toEqual({
      start: '14:30',
      end: '16:00',
      people: ['John', 'Jane'],
    });
  });

  test('should find overlapping time slots where at least 2 people are available', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const person1 = {
      id: '1',
      name: 'John',
      timeSlots: [
        { id: 'ts1', start: '09:00', end: '11:00' },
      ],
    };
    
    const person2 = {
      id: '2',
      name: 'Jane',
      timeSlots: [
        { id: 'ts2', start: '10:00', end: '12:00' },
      ],
    };
    
    const person3 = {
      id: '3',
      name: 'Bob',
      timeSlots: [
        { id: 'ts3', start: '11:30', end: '13:00' },
      ],
    };
    
    act(() => {
      result.current.addPerson(person1);
      result.current.addPerson(person2);
      result.current.addPerson(person3);
    });
    
    const overlapSlots = result.current.findOverlappingTimeSlots();
    
    expect(overlapSlots).toHaveLength(2);
    expect(overlapSlots[0]).toEqual({
      start: '10:00',
      end: '11:00',
      people: ['John', 'Jane'],
    });
    expect(overlapSlots[1]).toEqual({
      start: '11:30',
      end: '12:00',
      people: ['Jane', 'Bob'],
    });
  });

  test('should handle empty people list', () => {
    const { result } = renderHook(() => useScheduleFinder());
    
    const commonSlots = result.current.findCommonTimeSlots();
    const overlapSlots = result.current.findOverlappingTimeSlots();
    
    expect(commonSlots).toEqual([]);
    expect(overlapSlots).toEqual([]);
  });
});