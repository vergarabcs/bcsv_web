import { TGamePadAction } from '@/app/badmintonScore/types';
import { useState, useEffect, useCallback, useRef } from 'react';

interface ButtonMapping {
  [key: number]: TGamePadAction;
}

export const useGamepad = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [enabled, setIsEnabled] = useState<boolean>(true);
  const handlers = useRef<Map<TGamePadAction, () => void>>(new Map());
  const buttonMappings = useRef<ButtonMapping>({});
  const animationFrameId = useRef<number | null>(null);
  const connectedGamepads = useRef<Set<number>>(new Set());
  // Track previously pressed buttons to prevent repeated triggering
  const previousButtonStates = useRef<Map<number, boolean[]>>(new Map());

  // Poll for gamepad button states
  const pollGamepads = useCallback(() => {
    if (!enabled) return;

    const gamepads = navigator.getGamepads();
    
    // Check each connected gamepad
    for (const gamepadId of Array.from(connectedGamepads.current)) {
      const gamepad = gamepads[gamepadId];
      if (!gamepad) continue;

      // Initialize button state tracking for this gamepad if needed
      if (!previousButtonStates.current.has(gamepadId)) {
        previousButtonStates.current.set(
          gamepadId, 
          Array(gamepad.buttons.length).fill(false)
        );
      }
      
      const prevStates = previousButtonStates.current.get(gamepadId)!;

      // Check each button
      gamepad.buttons.forEach((button, index) => {
        const wasPressed = prevStates[index];
        const isPressed = button.pressed;
        
        // Update the previous state for next frame
        prevStates[index] = isPressed;
        
        // Only handle button press on initial press (not while held)
        if (isPressed && !wasPressed) {
          const action = buttonMappings.current[index];
          if (action) {
            const handler = handlers.current.get(action);
            if (handler) {
              handler();
            }
          }

          // If we're in listening mode, map this button press to the action
          if (isListening && listeningForAction.current) {
            buttonMappings.current[index] = listeningForAction.current;
            // Stop listening once we've mapped a button
            setIsListening(false);
            listeningForAction.current = null;
          }
        }
      });
    }

    // Continue polling
    animationFrameId.current = requestAnimationFrame(pollGamepads);
  }, [enabled, isListening]);

  // Track which action we're currently listening for
  const listeningForAction = useRef<TGamePadAction | null>(null);

  // Start gamepad polling
  const startPolling = useCallback(() => {
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(pollGamepads);
    }
  }, [pollGamepads]);

  // Stop gamepad polling
  const stopPolling = useCallback(() => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // Handle gamepad connection
  const handleGamepadConnected = useCallback((e: GamepadEvent) => {
    connectedGamepads.current.add(e.gamepad.index);
    startPolling();
  }, [startPolling]);

  // Handle gamepad disconnection
  const handleGamepadDisconnected = useCallback((e: GamepadEvent) => {
    connectedGamepads.current.delete(e.gamepad.index);
    // Clean up button state tracking for this gamepad
    previousButtonStates.current.delete(e.gamepad.index);
    
    if (connectedGamepads.current.size === 0) {
      stopPolling(); // Stop polling if no gamepads are connected
    }
  }, [stopPolling]);

  useEffect(() => {
    // Add event listeners for gamepad connections
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Check for already connected gamepads
    const initialGamepads = navigator.getGamepads();
    for (let i = 0; i < initialGamepads.length; i++) {
      if (initialGamepads[i]) {
        connectedGamepads.current.add(i);
      }
    }

    // Start polling if there are connected gamepads
    if (connectedGamepads.current.size > 0) {
      startPolling();
    }

    return () => {
      // Clean up event listeners
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      stopPolling();
      // Clear button state tracking
      previousButtonStates.current.clear();
    };
  }, [handleGamepadConnected, handleGamepadDisconnected, startPolling, stopPolling]);

  const startListening = useCallback((eventName: TGamePadAction, handler: () => void) => {
    // Store the handler
    handlers.current.set(eventName, handler);
    
    // Set listening state
    setIsListening(true);
    listeningForAction.current = eventName;
    
    // Make sure polling is active
    startPolling();
  }, [startPolling]);

  const dispatchAction = useCallback((eventName: TGamePadAction) => {
    // Execute the handler mapped to eventName
    const handler = handlers.current.get(eventName);
    if (handler && enabled) {
      handler();
    }
  }, [enabled]);

  const setEnabled = useCallback((isEnabled: boolean) => {
    setIsEnabled(isEnabled);
    
    // If disabled, stop polling. If enabled, start polling (if there are gamepads)
    if (!isEnabled) {
      stopPolling();
    } else if (connectedGamepads.current.size > 0) {
      startPolling();
    }
  }, [startPolling, stopPolling]);

  return {
    // states
    isListening,
    enabled,
    buttonMappings,

    // actions
    startListening,
    dispatchAction,
    setEnabled
  };
}