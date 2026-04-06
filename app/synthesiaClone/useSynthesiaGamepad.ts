'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const SYNTHESIA_GAMEPAD_ACTIONS = {
  PLAY_PAUSE: 'playPause',
  REWIND: 'rewind',
  FORWARD: 'forward',
} as const;

export type SynthesiaGamepadAction = typeof SYNTHESIA_GAMEPAD_ACTIONS[keyof typeof SYNTHESIA_GAMEPAD_ACTIONS];

type GamepadMappings = Record<SynthesiaGamepadAction, number | null>;

type UseSynthesiaGamepadArgs = {
  enabled?: boolean;
  onAction: (action: SynthesiaGamepadAction) => void;
};

type UseSynthesiaGamepadResult = {
  mappings: GamepadMappings;
  isListening: boolean;
  listeningAction: SynthesiaGamepadAction | null;
  startListening: (action: SynthesiaGamepadAction) => void;
};

const STORAGE_KEY = 'synthesia-clone.gamepad-mappings.v1';

const DEFAULT_MAPPINGS: GamepadMappings = {
  [SYNTHESIA_GAMEPAD_ACTIONS.PLAY_PAUSE]: null,
  [SYNTHESIA_GAMEPAD_ACTIONS.REWIND]: null,
  [SYNTHESIA_GAMEPAD_ACTIONS.FORWARD]: null,
};

const ACTIONS: SynthesiaGamepadAction[] = [
  SYNTHESIA_GAMEPAD_ACTIONS.PLAY_PAUSE,
  SYNTHESIA_GAMEPAD_ACTIONS.REWIND,
  SYNTHESIA_GAMEPAD_ACTIONS.FORWARD,
];

const resolveActionFromButton = (mappings: GamepadMappings, buttonIndex: number) => {
  for (const action of ACTIONS) {
    if (mappings[action] === buttonIndex) {
      return action;
    }
  }

  return null;
};

export function useSynthesiaGamepad({ enabled = true, onAction }: UseSynthesiaGamepadArgs): UseSynthesiaGamepadResult {
  const [mappings, setMappings] = useState<GamepadMappings>(DEFAULT_MAPPINGS);
  const [isListening, setIsListening] = useState(false);
  const [listeningAction, setListeningAction] = useState<SynthesiaGamepadAction | null>(null);

  const animationFrameId = useRef<number | null>(null);
  const connectedGamepads = useRef<Set<number>>(new Set());
  const previousButtonStates = useRef<Map<number, boolean[]>>(new Map());
  const enabledRef = useRef(enabled);
  const isListeningRef = useRef(isListening);
  const listeningActionRef = useRef(listeningAction);
  const mappingsRef = useRef(mappings);
  const onActionRef = useRef(onAction);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    listeningActionRef.current = listeningAction;
  }, [listeningAction]);

  useEffect(() => {
    mappingsRef.current = mappings;
  }, [mappings]);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const stopPolling = useCallback(() => {
    if (animationFrameId.current !== null) {
      window.cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const pollGamepads = useCallback(() => {
    if (!enabledRef.current) {
      stopPolling();
      return;
    }

    const gamepads = navigator.getGamepads();

    for (const gamepadId of Array.from(connectedGamepads.current)) {
      const gamepad = gamepads[gamepadId];
      if (!gamepad) {
        continue;
      }

      if (!previousButtonStates.current.has(gamepadId)) {
        previousButtonStates.current.set(gamepadId, Array(gamepad.buttons.length).fill(false));
      }

      const previousStates = previousButtonStates.current.get(gamepadId);
      if (!previousStates) {
        continue;
      }

      gamepad.buttons.forEach((button, index) => {
        const wasPressed = previousStates[index] ?? false;
        const isPressed = button.pressed;

        previousStates[index] = isPressed;

        if (!isPressed || wasPressed) {
          return;
        }

        const activeListeningAction = listeningActionRef.current;
        if (isListeningRef.current && activeListeningAction) {
          setMappings((prev) => ({ ...prev, [activeListeningAction]: index }));
          setIsListening(false);
          setListeningAction(null);
          isListeningRef.current = false;
          listeningActionRef.current = null;
          return;
        }

        const mappedAction = resolveActionFromButton(mappingsRef.current, index);
        if (mappedAction) {
          onActionRef.current(mappedAction);
        }
      });
    }

    animationFrameId.current = window.requestAnimationFrame(pollGamepads);
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    if (!enabledRef.current || animationFrameId.current !== null) {
      return;
    }

    animationFrameId.current = window.requestAnimationFrame(pollGamepads);
  }, [pollGamepads]);

  const handleGamepadConnected = useCallback((event: GamepadEvent) => {
    connectedGamepads.current.add(event.gamepad.index);
    startPolling();
  }, [startPolling]);

  const handleGamepadDisconnected = useCallback((event: GamepadEvent) => {
    connectedGamepads.current.delete(event.gamepad.index);
    previousButtonStates.current.delete(event.gamepad.index);

    if (connectedGamepads.current.size === 0) {
      stopPolling();
    }
  }, [stopPolling]);

  const startListening = useCallback((action: SynthesiaGamepadAction) => {
    setIsListening(true);
    setListeningAction(action);
    startPolling();
  }, [startPolling]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<GamepadMappings>;
      setMappings((prev) => ({
        ...prev,
        [SYNTHESIA_GAMEPAD_ACTIONS.PLAY_PAUSE]: typeof parsed.playPause === 'number' ? parsed.playPause : prev.playPause,
        [SYNTHESIA_GAMEPAD_ACTIONS.REWIND]: typeof parsed.rewind === 'number' ? parsed.rewind : prev.rewind,
        [SYNTHESIA_GAMEPAD_ACTIONS.FORWARD]: typeof parsed.forward === 'number' ? parsed.forward : prev.forward,
      }));
    } catch (error) {
      console.warn('Unable to restore Synthesia gamepad mappings from local storage.', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const gamepads = navigator.getGamepads();
    for (let index = 0; index < gamepads.length; index += 1) {
      if (gamepads[index]) {
        connectedGamepads.current.add(index);
      }
    }

    if (enabled && connectedGamepads.current.size > 0) {
      startPolling();
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      stopPolling();
      previousButtonStates.current.clear();
      connectedGamepads.current.clear();
    };
  }, [enabled, handleGamepadConnected, handleGamepadDisconnected, startPolling, stopPolling]);

  useEffect(() => {
    if (!enabled) {
      setIsListening(false);
      setListeningAction(null);
      stopPolling();
      return;
    }

    if (connectedGamepads.current.size > 0) {
      startPolling();
    }
  }, [enabled, startPolling, stopPolling]);

  return {
    mappings,
    isListening,
    listeningAction,
    startListening,
  };
}
