import { CSSProperties } from "react";
import { PropsBoard } from "../types";
import styles from '@/app/page.module.css'
import { L_RANGE } from "../constants";

const getCellStyle = (highlighted: number[][], iRow:number, iCol:number):CSSProperties|undefined => {
  const hIndex = highlighted.findIndex((coord) => coord[0] === iRow && coord[1] === iCol)
  if(hIndex < 0) return

  const lightness = L_RANGE.MIN + (L_RANGE.MAX - L_RANGE.MIN) * ((hIndex+1)/(highlighted.length))

  return {
    backgroundColor: `hsl(193, 90%, ${lightness}%)`
  }
}

export const Board = ({
  board,
  highlighted
}: PropsBoard) => {

  const renderRow = (row:string[], iRow:number) => {
    return <div key={iRow} className={styles.row}>
      {row.map((cell, iCol) => {
        
        return <div key={iCol} className={styles.cell} style={getCellStyle(highlighted, iRow, iCol)}>
            {cell}
        </div>
      })}
    </div>
  }

  return <div className={styles.board}>
    {board.map(renderRow)}
  </div>
}