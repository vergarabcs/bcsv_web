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
  // Sort words by length (longer words first)
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  const hasWords = sortedWords.length > 0;
  const title = validWords ? 'Results' : 'Existing Words';

  return (
    <div className={styles.wordlist}>
      <div className={styles.wordListHeader}>
        <div>{title}</div>
        <span className={styles.wordCounter}>{sortedWords.length} words</span>
      </div>
      {hasWords ? (
        <ul>
          {sortedWords.map((word) => {
            const className = getRowClassName(word, validWords);
            return (
              <li
                key={word}
                className={className}
                onMouseOver={() => onHoverWord?.(word)}
              >
                <span>{word}</span>
                {<span className={styles.wordCounter}>{word.length}</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.emptyList}>
          No words yet. Start typing to add words!
        </div>
      )}
    </div>
  );
}