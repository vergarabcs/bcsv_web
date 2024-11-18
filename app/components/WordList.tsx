import styles from '@/app/page.module.css'
import { TGameStatus } from '../types'

export type WordListProps = {
  words: string[],
  onHoverWord?: (word: string) => void,
  validWords?: string[],
}

const getRowClassName = (
  word: string, 
  validWords?: string[], 
) => {
  if(!validWords) return undefined
  if(!validWords.includes(word)) return styles.redBg
  return styles.greenBg
}

export const WordList = ({
  words,
  onHoverWord,
  validWords
}: WordListProps) => {
  return <div className={styles.wordlist}><ul>
    {words.map((word) => {
      const className = getRowClassName(
        word,
        validWords,
      )
      return (<li
        key={word}
        className={className}
        onMouseOver={() => onHoverWord?.(word)}
      >
        {word}
      </li>)
    })}
  </ul></div>
}