import { TGamePadAction } from '@/app/badmintonScore/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useBadmintonStore } from './useBadmintonStore';

export type InputDevice = 'gamepad' | 'keyboard';

export interface InputMapping {
  device: InputDevice;
  code: string | number; // key code for keyboard, button index for gamepad
  action: TGamePadAction;
}

export const useGamepad = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [enabled, setIsEnabled] = useState<boolean>(true);
  const [listeningDevice, setListeningDevice] = useState<InputDevice>('gamepad');
  const listeningForAction = useRef<TGamePadAction | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const connectedGamepads = useRef<Set<number>>(new Set());
  
  // Track previously pressed buttons to prevent repeated triggering
  const previousButtonStates = useRef<Map<number, boolean[]>>(new Map());
  
  // Track pressed keyboard keys to prevent repeated triggering
  const pressedKeys = useRef<Set<string>>(new Set());
  
  // Get button mappings and actions from the store
  const buttonMappings = useBadmintonStore(state => state.buttonMappings);
  const keyMappings = useBadmintonStore(state => state.keyMappings);
  const updateButtonMapping = useBadmintonStore(state => state.updateButtonMapping);
  const updateKeyMapping = useBadmintonStore(state => state.updateKeyMapping);
  const dispatchGamepadAction = useBadmintonStore(state => state.dispatchGamepadAction);
  
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
          const action = buttonMappings[index];
          if (action) {
            dispatchGamepadAction(action);
          }

          // If we're in listening mode for gamepad, map this button press to the action
          if (isListening && listeningForAction.current && listeningDevice === 'gamepad') {
            updateButtonMapping(index, listeningForAction.current);
            // Stop listening once we've mapped a button
            setIsListening(false);
            listeningForAction.current = null;
          }
        }
      });
    }

    // Continue polling
    animationFrameId.current = requestAnimationFrame(pollGamepads);
  }, [enabled, isListening, listeningDevice, buttonMappings, updateButtonMapping, dispatchGamepadAction]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Prevent repeated triggers while key is held down
    if (pressedKeys.current.has(event.code)) return;
    
    // Add to pressed keys
    pressedKeys.current.add(event.code);
    
    // If we're in listening mode for keyboard, map this key to the action
    if (isListening && listeningForAction.current && listeningDevice === 'keyboard') {
      event.preventDefault();
      updateKeyMapping(event.code, listeningForAction.current);
      // Stop listening once we've mapped a key
      setIsListening(false);
      listeningForAction.current = null;
      return;
    }
    
    // Otherwise check if this key has a mapping
    const action = keyMappings[event.code];
    if (action) {
      event.preventDefault();
      dispatchGamepadAction(action);
    }
  }, [enabled, isListening, listeningDevice, keyMappings, updateKeyMapping, dispatchGamepadAction]);
  
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // Remove from pressed keys
    pressedKeys.current.delete(event.code);
  }, []);

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
    // Add event listeners for gamepad connections and keyboard events
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopPolling();
      // Clear button state tracking
      previousButtonStates.current.clear();
      // Clear pressed keys
      pressedKeys.current.clear();
    };
  }, [handleGamepadConnected, handleGamepadDisconnected, handleKeyDown, handleKeyUp, startPolling, stopPolling]);

  const startListening = useCallback((eventName: TGamePadAction, device: InputDevice = 'gamepad') => {
    // Set listening state
    setIsListening(true);
    setListeningDevice(device);
    listeningForAction.current = eventName;
    
    // Make sure polling is active for gamepad
    if (device === 'gamepad') {
      startPolling();
    }
  }, [startPolling]);

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
    listeningDevice,
    enabled,
    buttonMappings,
    keyMappings,

    // actions
    startListening,
    setEnabled
  };
}