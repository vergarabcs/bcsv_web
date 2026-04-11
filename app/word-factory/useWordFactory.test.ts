import { describe, expect, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';

import { TGameStatus } from '../types';
import { useWordFactory } from './useWordFactory';

describe("useWordFactory", () => {
    test('initializes in standby state', () => {
        const { result } = renderHook(() => useWordFactory());

        expect(result.current.gameStatus).toBe(TGameStatus.STANDBY);
        expect(result.current.board).toEqual([]);
        expect(result.current.userName).toBe('Player');
    });
});