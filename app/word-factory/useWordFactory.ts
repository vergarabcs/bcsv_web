import { useEffect, useState } from "react"
import { findValidWords, generateBoard, generateRotations, getHighlighted, getListScore, getTrie, squarify } from "./utils";
import { BOARD_SIZE, DEFAULT_TIME, STORE_KEYS } from "../constants";
import { TCardinalRotations, TGameStatus } from "../types";
import { useTimer } from "../lib/hooks/useTimer";

export const useWordFactory = () => {
  const [board, setBoard] = useState<string[][]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const userName = 'Player' // temporary
  const [gameStatus, setGameStatus] = useState<TGameStatus>(TGameStatus.STANDBY);
  const [allValidWords, setAllValidWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);

  // player move map
  const [moves, setMoves] = useState<Record<string, undefined | string[]>>({});
  const [inputTxt, setInputTxt] = useState('');
  const [highlighted, setHighLighted] = useState<number[][]>([]);
  const [rotations, setRotations] = useState<TCardinalRotations[][]>([]);

  useEffect(() => {
    // warm up the cache
    getTrie()
  }, [])

  const getPlayerMoves = () => {
    if(!userName) return []
    return moves[userName] ?? []
  }

  const handleFinish = async () => {
    setGameStatus(TGameStatus.FINISHED)
    const _vw = await findValidWords(board)
    setAllValidWords(_vw)
    setScore(
      Math.max(
        getListScore(
          getPlayerMoves(),
          _vw
        ),
        0
      )
    )
  }

  const {
    remainingTime,
    startCountDown
  } = useTimer(handleFinish, DEFAULT_TIME)

  const createNewBoard = () => {
    setBoard(squarify(BOARD_SIZE, generateBoard()))
    setRotations(squarify(BOARD_SIZE, generateRotations()))
  }

  const setInputAndHighlight = (newTxt: string) => {
    setInputTxt(newTxt);
    setHighLighted(getHighlighted(newTxt, board))
  }

  const startGame = () => {
    createNewBoard()
    setGameStatus(TGameStatus.PLAYING)
    setMoves({})
    startCountDown()
    setHighLighted([])
  }

  const enterWord = (word: string) => {
    if(!userName) return;
    if(gameStatus !== TGameStatus.PLAYING) return;
    setMoves((prevValue) => ({
      ...prevValue,
      [userName]: [
        ...(prevValue[userName] ?? []),
        word
      ]
    }))
  }

  return {
    allValidWords,
    board,
    enterWord,
    gameStatus,
    highlighted,
    inputTxt,
    moves,
    remainingTime,
    rotations,
    score,
    setHighLighted,
    setInputAndHighlight,
    setInputTxt,
    startGame,
    userName,
  }
}