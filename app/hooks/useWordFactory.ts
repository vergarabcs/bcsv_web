import { useState } from "react"
import { generateBoard, generateRotations, squarify } from "./utils";
import { BOARD_SIZE, DEFAULT_TIME } from "../constants";
import { TCardinalRotations } from "../types";

export const useWordFactory = () => {
  const [board, setBoard] = useState<string[][]>([]);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [players, setPlayers] = useState<string[]>([]);
  const [moves, setMoves] = useState<Record<string, string[]>>({});
  const [currWord, setCurrWord] = useState<string>('');
  const [selectedIndices, setSelectedIndices] = useState<number[][]>([]);
  const [rotations, setRotations] = useState<TCardinalRotations[][]>([]);

  const createNewBoard = () => {
    setBoard(squarify(BOARD_SIZE, generateBoard()))
    setRotations(squarify(BOARD_SIZE, generateRotations()))
  }

  const handlePressKey = (char: string) => {
    
  }

  const handleClickIndex = (index: number[]) => {
    
  }

  return {
    createNewBoard,
    handlePressKey,
    board,
    rotations
  }
}