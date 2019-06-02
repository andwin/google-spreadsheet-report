const columnNameToNumber = require('./columnNameToNumber')

describe('columnNameToNumber', () => {
  it('converts column number to name', () => {
    expect(columnNameToNumber('A')).toBe(1)
    expect(columnNameToNumber('Z')).toBe(26)
    expect(columnNameToNumber('AY')).toBe(51)
    expect(columnNameToNumber('AZ')).toBe(52)
    expect(columnNameToNumber('CB')).toBe(80)
    expect(columnNameToNumber('YZ')).toBe(676)
    expect(columnNameToNumber('ZZ')).toBe(702)
    expect(columnNameToNumber('AAC')).toBe(705)
  })
})
