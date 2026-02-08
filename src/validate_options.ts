export type SpreadsheetOptions = {
  email: string
  key: string
  spreadsheetId: string
  sheet?: string
  retention?: number
  keyName?: string
}

const validateOptions = (options: Partial<SpreadsheetOptions>): void => {
  if (!options.email) throw new TypeError('parameter "email" is missing')
  if (!options.key) throw new TypeError('parameter "key" is missing')
  if (!options.spreadsheetId)
    throw new TypeError('parameter "spreadsheetId" is missing')
}

export default validateOptions
