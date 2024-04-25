'use client'
import styles from './page.module.css'
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';
import { Board } from './components/Board';
import { useEffect, useState } from 'react';
import { findValidWords, getHighlighted } from './hooks/utils';
import { useWordFactory } from './hooks/useWordFactory';
import { WordList } from './components/WordList';
Amplify.configure(config);

export default function Home() {
  const [inputTxt, setInputTxt] = useState('');
  const [highlighted, setHighLighted] = useState<number[][]>([]);
  const {
    createNewBoard,
    handlePressKey,
    board
  } = useWordFactory()
  const [words, setWords] = useState<string[]>(findValidWords(board));

  useEffect(() => {
    createNewBoard()
  }, [])

  useEffect(() => {
    setHighLighted(getHighlighted(inputTxt, board))
  }, [inputTxt])

  useEffect(() => {
    setWords(findValidWords(board))
  }, [board])


  return (
    <main className={styles.main}>
      <Board board={board} highlighted={highlighted}/>
      <WordList words={words} onHoverWord={(word) => setHighLighted(getHighlighted(word, board))}/>
      <input 
        name='myInput'
        value={inputTxt}
        placeholder='Enter words here'
        onChange={e => setInputTxt(e.target.value.toUpperCase())}
        onKeyUp={e => {
          if(e.key !== 'Enter') return;
          if(highlighted.length <= 0) return;
          if(words.includes(inputTxt)) return;
          setWords([...words, inputTxt])
          setInputTxt('')
        }}
      />
    </main>
  )
}
