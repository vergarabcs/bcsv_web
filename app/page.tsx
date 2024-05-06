'use client'
import styles from './page.module.css'
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';
import { Board } from './components/Board';
import { useEffect, useState } from 'react';
import { findValidWords, getHighlighted } from './hooks/utils';
import { useWordFactory } from './hooks/useWordFactory';
import { WordList } from './components/WordList';
import { TGameStatus } from './types';
Amplify.configure(config);

export default function Home() {
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
    gameStatus
  } = useWordFactory()

  const words = userName ? (
    moves[userName] ?? []
  ) : (
    []
  )

  const renderValidWords = () => {
    if(!allValidWords) return null;
    if(gameStatus !== TGameStatus.FINISHED) return null;
    return <WordList words={allValidWords} />
  }

  return (
    <main className={styles.main}>
      <Board board={board} highlighted={highlighted} rotations={rotations}/>
      {renderValidWords()}
      <WordList 
        words={words} 
        onHoverWord={(word) => setHighLighted(getHighlighted(word, board))}
      />
      <button onClick={startGame}>Start Game</button>
      <div>{remainingTime}</div>
      <input 
        name='myInput'
        value={inputTxt}
        placeholder='Enter words here'
        onChange={e => setInputTxt(e.target.value.toUpperCase())}
        onKeyUp={e => {
          if(e.key !== 'Enter') return;
          if(highlighted.length <= 0) return;
          if(words.includes(inputTxt)) return;
          enterWord(inputTxt)
          setInputTxt('')
        }}
      />
    </main>
  )
}
