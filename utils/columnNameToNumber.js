function columnNameToNumber(letters) {
  return letters.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0)
}

module.exports = columnNameToNumber
