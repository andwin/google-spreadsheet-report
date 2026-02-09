import { describe, expect, it } from 'vitest'
import valueArray from './value_array'

describe('valueArray', () => {
  it('returns array with values at expected positions', () => {
    const data = {
      date: '2000-01-01',
      val1: '1',
      val2: 2,
    }
    const headers = ['date', 'val2', 'val1']
    const expected = ['2000-01-01', 2, '1']

    const result = valueArray(data, headers)

    expect(result).toEqual(expected)
  })
})
