'use client'
import { useWordFactory } from "../hooks/useWordFactory";
import { getHighlighted } from "../hooks/utils";
import { TGameStatus } from "../types";
import { WordList } from "./WordList";
import styles from '../page.module.css';
import { Board } from "./Board";

export default function WordFactory() {
  const {
    board,
    rotations,
    remainingTime,
    highlighted,
    inputTxt,
    moves,
    userName,
    setHighLighted,
    setInputTxt,
    enterWord,
    startGame,
    allValidWords,
    gameStatus,
    score
  } = useWordFactory()

  const words = userName ? (
    moves[userName] ?? []
  ) : (
    []
  )

  const renderValidWords = () => {
    if (!allValidWords) return null;
    if (gameStatus !== TGameStatus.FINISHED) return null;
    return <WordList words={allValidWords} onHoverWord={handleHover} />
  }

  const renderScore = () => {
    if (gameStatus !== TGameStatus.FINISHED) return null;
    return <div className={styles.scoreDisplay}>Score: {score}</div>
  }

  const handleHover = (word: string) => setHighLighted(getHighlighted(word, board))

  const renderInput = () => {
    if (gameStatus !== TGameStatus.PLAYING) return null
    return (
      <input
        className={styles.wordInput}
        name='myInput'
        value={inputTxt}
        placeholder='Enter words here'
        onChange={e => setInputTxt(e.target.value.toUpperCase())}
        onKeyUp={e => {
          if (e.key !== 'Enter') return;
          if (highlighted.length <= 0) return;
          if (words.includes(inputTxt)) return;
          enterWord(inputTxt)
          setInputTxt('')
        }}
      />
    )
  }

  const renderStartGameButton = () => {
    if (gameStatus === TGameStatus.PLAYING) return null
    return <button className={styles.gameButton} onClick={startGame}>Start Game</button>
  }

  const renderTimer = () => {
    if (gameStatus !== TGameStatus.PLAYING) return null;
    return <div className={styles.timerDisplay}>{remainingTime}</div>;
  }

  return (
    <main className={styles.main}>
      <Board 
        board={board} 
        highlighted={highlighted} 
        rotations={rotations}
        gameStatus={gameStatus} 
      />
      
      <div className={styles.gameControls}>
        {renderTimer()}
        {renderStartGameButton()}
        {renderScore()}
        {renderInput()}
      </div>
      
      <div className={styles.wordListContainer}>
        <WordList
          words={words}
          onHoverWord={handleHover}
          validWords={(gameStatus === TGameStatus.FINISHED) ? allValidWords : undefined}
        />
        {renderValidWords()}
      </div>
    </main>
  )
}