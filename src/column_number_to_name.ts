const baseChar = 'A'.charCodeAt(0)
const columnNumberZ = 26

const columnNumberToName = (columnNumber: number): string => {
  let columnName = ''
  let num = columnNumber

  do {
    num -= 1
    columnName =
      String.fromCharCode(baseChar + (num % columnNumberZ)) + columnName
    num = Math.floor(num / 26)
  } while (num > 0)

  return columnName
}

export default columnNumberToName
