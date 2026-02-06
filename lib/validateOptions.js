const validateOptions = (options) => {
  if (!options.email) throw new TypeError('parameter "email" is missing')
  if (!options.key) throw new TypeError('parameter "key" is missing')
  if (!options.spreadsheetId)
    throw new TypeError('parameter "spreadsheetId" is missing')
}

module.exports = validateOptions
