const baseChar = ('A').charCodeAt(0)
const columnNumberZ = 26

const columnNumberToName = (columnNumber) => {
  let columnName = ''

  do {
    columnNumber -= 1
    columnName = String.fromCharCode(baseChar + (columnNumber % columnNumberZ)) + columnName
    columnNumber = Math.floor(columnNumber / 26)
  } while (columnNumber > 0)

  return columnName
}

module.exports = columnNumberToName
