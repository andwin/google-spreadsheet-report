import { describe, expect, it } from 'vitest'
import validateOptions from './validate_options'

describe('validateOptions', () => {
  it('throws exception if email is missing', () => {
    const options = {
      key: 'key',
      spreadsheetId: 'spreadsheetId',
    }
    expect(() => validateOptions(options)).toThrow(TypeError)
  })

  it('throws exception if key is missing', () => {
    const options = {
      email: 'email',
      spreadsheetId: 'spreadsheetId',
    }
    expect(() => validateOptions(options)).toThrow(TypeError)
  })

  it('throws exception if spreadsheetId is missing', () => {
    const options = {
      key: 'key',
      email: 'email',
    }
    expect(() => validateOptions(options)).toThrow(TypeError)
  })

  it('does not throws exception if all expected parameters are present', () => {
    const options = {
      email: 'email',
      key: 'key',
      spreadsheetId: 'spreadsheetId',
    }

    expect(() => validateOptions(options)).not.toThrow(TypeError)
  })
})
