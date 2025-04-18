import { describe, expect, jest, test } from "@jest/globals";
import { renderHook, waitFor } from '@testing-library/react'
import { useTimer } from "../useTimer";
import { sleep } from "../utils";
import { act } from "react-dom/test-utils";

describe("useTimer", () => {
  test('remaining time does not go negative', async () => {
    const TEST_TIME = 1
    const mockOnFinishCallback = jest.fn(() => {})
    const {
      result,
      unmount
    } = renderHook(() => useTimer(mockOnFinishCallback, TEST_TIME))

    act(() => {
      expect(result.current.remainingTime).toBe(TEST_TIME)
      result.current.startCountDown()
    })

    await sleep(2000);
    expect(mockOnFinishCallback).toHaveBeenCalledTimes(1)
    expect(result?.current?.remainingTime).toBe(0)
    unmount()
  })
})