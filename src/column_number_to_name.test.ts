import columnNumberToName from './column_number_to_name'

describe('columnNumberToName', () => {
  it('converts column number to name', () => {
    expect(columnNumberToName(1)).toBe('A')
    expect(columnNumberToName(26)).toBe('Z')
    expect(columnNumberToName(51)).toBe('AY')
    expect(columnNumberToName(52)).toBe('AZ')
    expect(columnNumberToName(80)).toBe('CB')
    expect(columnNumberToName(676)).toBe('YZ')
    expect(columnNumberToName(702)).toBe('ZZ')
    expect(columnNumberToName(705)).toBe('AAC')
  })
})
