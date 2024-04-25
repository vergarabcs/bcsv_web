import styles from '@/app/page.module.css'

export type WordListProps = {
  words: string[],
  onHoverWord?: (word: string) => void
}

export const WordList = ({
  words,
  onHoverWord
}: WordListProps) => {
  return <div className={styles.wordlist}><ul>
    {words.map((word) => {
      return (<li
        key={word}
        onMouseOver={() => onHoverWord?.(word)}
      >
        {word}
      </li>)
    })}
  </ul></div>
}