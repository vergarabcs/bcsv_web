import { useState } from "react"
import { generateBoard, squarify } from "./utils";
import { BOARD_SIZE, DEFAULT_TIME } from "../constants";

export const useWordFactory = () => {
  const [board, setBoard] = useState<string[][]>([]);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [players, setPlayers] = useState<string[]>([]);
  const [moves, setMoves] = useState<Record<string, string[]>>({});
  const [currWord, setCurrWord] = useState<string>('');
  const [selectedIndices, setSelectedIndices] = useState<number[][]>([]);

  const createNewBoard = () => {
    setBoard(squarify(BOARD_SIZE, generateBoard()))
  }

  const handlePressKey = (char: string) => {
    
  }

  const handleClickIndex = (index: number[]) => {
    
  }

  return {
    createNewBoard,
    handlePressKey,
    board
  }
}