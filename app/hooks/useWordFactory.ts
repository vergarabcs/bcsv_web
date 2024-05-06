import { useEffect, useState } from "react"
import { findValidWords, generateBoard, generateRotations, getHighlighted, squarify } from "./utils";
import { BOARD_SIZE, STORE_KEYS } from "../constants";
import { TCardinalRotations, TGameStatus } from "../types";
import { useTimer } from "./useTimer";

export const useWordFactory = () => {
  const [board, setBoard] = useState<string[][]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<TGameStatus>(TGameStatus.STANDBY);
  const [userName, setUserName] = useState<string | undefined>();
  const [allValidWords, setAllValidWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);

  // player move map
  const [moves, setMoves] = useState<Record<string, undefined | string[]>>({});
  const [inputTxt, setInputTxt] = useState('');
  const [highlighted, setHighLighted] = useState<number[][]>([]);
  const [rotations, setRotations] = useState<TCardinalRotations[][]>([]);

  useEffect(() => {
    if (userName) return;
    const newUsername = localStorage.getItem(STORE_KEYS.USERNAME) ??
    window.prompt('Who are you?') ??
    ''
    setUserName(newUsername)
    localStorage.setItem(STORE_KEYS.USERNAME, newUsername)
  }, [userName])

  useEffect(() => {
    setHighLighted(getHighlighted(inputTxt, board))
  }, [inputTxt])

  const handleFinish = () => {
    setGameStatus(TGameStatus.FINISHED)
    setAllValidWords(findValidWords(board))
  }

  const {
    remainingTime,
    startCountDown
  } = useTimer(handleFinish)

  const createNewBoard = () => {
    setBoard(squarify(BOARD_SIZE, generateBoard()))
    setRotations(squarify(BOARD_SIZE, generateRotations()))
  }

  const startGame = () => {
    createNewBoard()
    setGameStatus(TGameStatus.PLAYING)
    startCountDown()
  }

  const enterWord = (word: string) => {
    if(!userName) return;
    setMoves((prevValue) => ({
      ...prevValue,
      [userName]: [
        ...(prevValue[userName] ?? []),
        word
      ]
    }))
  }

  const handleClickIndex = (index: number[]) => {

  }

  return {
    board,
    enterWord,
    highlighted,
    inputTxt,
    moves,
    remainingTime,
    rotations,
    setHighLighted,
    setInputTxt,
    startGame,
    userName,
    allValidWords,
    gameStatus
  }
}