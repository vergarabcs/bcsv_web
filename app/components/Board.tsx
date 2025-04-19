import { CSSProperties } from "react";
import { PropsBoard, TCardinalRotations, TGameStatus } from "../types";
import styles from '@/app/page.module.css'
import { L_RANGE, UNDERLINED_STRING } from "../constants";
import { isValidHighlights } from "../hooks/utils";

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
  rotations,
  gameStatus,
  enterWord,
  setHighLighted,
  inputTxt,
  setInputTxt
}: PropsBoard) => {
  const getBoardTitle = () => {
    switch(gameStatus) {
      case TGameStatus.STANDBY:
        return "Ready to Play";
      case TGameStatus.PLAYING:
        return "Find Words";
      case TGameStatus.FINISHED:
        return "Game Complete";
      default:
        return "Word Board";
    }
  };

  const getCellClassName = (iRow: number, iCol: number) => {
    const isHighlighted = highlighted.some(coord => coord[0] === iRow && coord[1] === iCol);
    return `${styles.cell} ${isHighlighted ? styles.cellHighlighted : ''}`;
  };

  const clickCell = (iRow: number, iCol: number, char: string) => {
    const newIndices = [...highlighted, [iRow, iCol]];
    if(isValidHighlights(newIndices)){
      setInputTxt(inputTxt + char)
      setHighLighted(newIndices)
    }
  }

  const renderRow = (row:string[], iRow:number) => {
    return <div key={iRow} className={styles.row}>
      {row.map((cell, iCol) => {
        return <div 
          key={iCol} 
          onClick={() => clickCell(iRow, iCol, cell)}
          className={getCellClassName(iRow, iCol)}
          style={getCellStyle(highlighted, iRow, iCol, cell, rotations)}
        >
          {cell}
        </div>
      })}
    </div>
  }

  const handleCancel = () => {
    setInputTxt("");
    setHighLighted([]);
  };

  const handleEnter = () => {
    console.log("Word submitted:", inputTxt);
    setInputTxt("");
    setHighLighted([]);
    enterWord(inputTxt);
  };

  return (
    <div className={styles.board}>
      <div className={styles.boardTitle}>{getBoardTitle()}</div>
      {board.map(renderRow)}
      {inputTxt && (
        <div className={styles.gameControls}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
            <button 
              className={styles.gameButton} 
              onClick={handleCancel}
              style={{ backgroundColor: '#dc3545', flex: 1 }}
            >
              Cancel
            </button>
            <button 
              className={styles.gameButton} 
              onClick={handleEnter}
              style={{ backgroundColor: '#28a745', flex: 1 }}
            >
              Enter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}