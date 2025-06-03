import { renderHook, act } from '@testing-library/react';
import { useGamepad } from './useGamepad';

// Mock navigator.getGamepads
const mockGetGamepads = jest.fn();
Object.defineProperty(navigator, 'getGamepads', {
  value: mockGetGamepads,
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 0);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

describe('useGamepad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockGetGamepads.mockImplementation(() => []);
  });

  test('starts listening for gamepad actions', () => {
    const { result } = renderHook(() => useGamepad());
    
    const mockHandler = jest.fn();
    
    act(() => {
      result.current.startListening('team1Scores', mockHandler);
    });
    
    expect(result.current.isListening).toBe(true);
  });
  
  test('dispatches actions correctly', () => {
    const { result } = renderHook(() => useGamepad());
    
    const mockHandler = jest.fn();
    
    // Register a handler
    act(() => {
      result.current.startListening('team1Scores', mockHandler);
      // Stop listening mode (simulating button press)
      result.current.isListening = false;
    });
    
    // Dispatch the action
    act(() => {
      result.current.dispatchAction('team1Scores');
    });
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
  
  test('properly enables and disables gamepad controls', () => {
    const { result } = renderHook(() => useGamepad());
    
    // Initially enabled
    expect(result.current.enabled).toBe(true);
    
    // Disable
    act(() => {
      result.current.setEnabled(false);
    });
    
    expect(result.current.enabled).toBe(false);
    
    // Re-enable
    act(() => {
      result.current.setEnabled(true);
    });
    
    expect(result.current.enabled).toBe(true);
  });
  
  test('responds to gamepad connected events', () => {
    const { result } = renderHook(() => useGamepad());
    
    // Simulate a gamepad connection
    act(() => {
      const gamepadConnectedEvent = new Event('gamepadconnected') as any;
      gamepadConnectedEvent.gamepad = { index: 0, buttons: [], axes: [] };
      window.dispatchEvent(gamepadConnectedEvent);
    });
    
    // Mock a gamepad for the polling function
    mockGetGamepads.mockImplementation(() => {
      const gamepad = {
        index: 0,
        buttons: [{ pressed: false }, { pressed: false }],
        axes: [0, 0, 0, 0],
      };
      
      const gamepads = [];
      gamepads[0] = gamepad;
      return gamepads;
    });
    
    // The hook should now be polling
    expect(requestAnimationFrame).toHaveBeenCalled();
  });
});