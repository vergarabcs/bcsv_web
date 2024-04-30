import { CSSProperties } from "react";
import { PropsBoard, TCardinalRotations } from "../types";
import styles from '@/app/page.module.css'
import { L_RANGE, ROTATION_DEG, UNDERLINED_STRING } from "../constants";
import { randomPickElements } from "../hooks/utils";

const getCellStyle = (
  highlighted: number[][], 
  iRow:number, iCol:number, 
  cell:string,
  rotations: TCardinalRotations[][]
):CSSProperties => {
  const hIndex = highlighted.findIndex((coord) => coord[0] === iRow && coord[1] === iCol)
  const returnValue:CSSProperties = {
    transform: `rotate(${rotations[iRow][iCol]}deg)`,
    textDecoration: UNDERLINED_STRING.includes(cell) ? 'underline' : undefined
  }
  if(hIndex < 0) return returnValue

  const lightness = L_RANGE.MIN + (L_RANGE.MAX - L_RANGE.MIN) * ((hIndex+1)/(highlighted.length))

  returnValue.backgroundColor = `hsl(193, 90%, ${lightness}%)`
  return returnValue
}

export const Board = ({
  board,
  highlighted,
  rotations
}: PropsBoard) => {

  const renderRow = (row:string[], iRow:number) => {
    return <div key={iRow} className={styles.row}>
      {row.map((cell, iCol) => {
        
        return <div key={iCol} className={styles.cell} style={getCellStyle(highlighted, iRow, iCol, cell, rotations)}>
            {cell}
        </div>
      })}
    </div>
  }

  return <div className={styles.board}>
    {board.map(renderRow)}
  </div>
}