const dayjs = require('dayjs')
const columnNumberToName = require('../utils/columnNumberToName')
const valueArray = require('../utils/valueArray')
const validateOptions = require('./validateOptions')
const spreadsheets = require('./spreadsheetapi')

/**
 * @description
 * Append data to the spreadsheet.
 *
 * @param {Object} data Object containing the values to be added
 * @param {Object} options
 * @param {String} options.email Email of the account with access to the spreadsheet
 * @param {String} options.key Key to access the spreadsheet
 * @param {String} options.spreadsheetId Id of the spreadsheet
 * @param {String} [options.sheet] Name of the sheet. Defaults to the first sheet.
 * @param {Number} [options.retention] Retention in days. Defaults to 14.
 */
const appendData = async (data, options) => {
  validateOptions(options)

  // set defaults
  data.date = data.date || dayjs().format('YYYY-MM-DD HH:mm')
  options.sheet = options.sheet || ''
  options.retention = options.retention || 14

  const auth = await spreadsheets.authorize(options)
  const version = 'v4'
  const sheets = spreadsheets.client(auth, version)

  const sheetId = await makeSureSheetExists(sheets, options)

  const headers = await makeSureHeadersExist(sheets, data, options)

  await appendDataToSheet(sheets, data, headers, options)

  await purgeRows(sheets, sheetId, options)
}

const makeSureSheetExists = async (sheets, options) => {
  const { spreadsheetId } = options
  if (!options.sheet) return 0

  const res = await spreadsheets.get(sheets, { spreadsheetId })
  const found = res.data.sheets.find((s) => s.properties.title === options.sheet)
  if (found) return found.properties.sheetId

  const request = {
    spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: options.sheet,
            },
          },
        },
      ],
    },
  }
  const sheet = await spreadsheets.batchUpdate(sheets, request)
  const [reply] = sheet.data.replies
  return reply.addSheet.properties.sheetId
}

const makeSureHeadersExist = async (sheets, data, options) => {
  const headers = Object.keys(data).filter((h) => h !== 'undefined' && h !== 'date')
  headers.unshift('date')
  const { spreadsheetId, sheet } = options
  const numberOfColumnsToCheck = 100

  const rangeLimit = columnNumberToName(numberOfColumnsToCheck)
  const request = {
    spreadsheetId,
    range: `${sheet}!A1:${rangeLimit}1`,
  }

  const getRes = await spreadsheets.valuesGet(sheets, request)

  const [sheetHeaders] = getRes.data.values || [[]]
  const missingHeaders = headers.filter((h) => !sheetHeaders.includes(h))
  if (!missingHeaders.length) return sheetHeaders

  if (sheetHeaders.length && sheetHeaders[0] !== 'date') {
    throw new Error('The first column header must be \'date\'')
  }

  const firstFreeColumnNumber = sheetHeaders.length + 1
  const firstFreeColumnName = columnNumberToName(firstFreeColumnNumber)

  const appendRequest = {
    spreadsheetId,
    range: `${sheet}!${firstFreeColumnName}1`,
    valueInputOption: 'RAW',
    resource: {
      values: [
        missingHeaders,
      ],
    },
  }
  await spreadsheets.valuesAppend(sheets, appendRequest)

  return sheetHeaders.concat(missingHeaders)
}

const appendDataToSheet = async (sheets, data, headers, options) => {
  const { spreadsheetId, sheet } = options
  const values = valueArray(data, headers)
  const appendRequest = {
    spreadsheetId,
    range: `${sheet}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values: [values],
    },
  }

  return spreadsheets.valuesAppend(sheets, appendRequest)
}

const purgeRows = async (sheets, sheetId, options) => {
  const { spreadsheetId, sheet } = options
  const numberOfRowsToCheck = 1000

  const request = {
    spreadsheetId,
    range: `${sheet}!A2:A${numberOfRowsToCheck + 1}`,
  }

  const getRes = await spreadsheets.valuesGet(sheets, request)
  if (!getRes.data.values) return

  const limit = dayjs().subtract(options.retention, 'days')
  const deleteRequests = []
  getRes.data.values.forEach((values, i) => {
    const [value] = values
    const date = dayjs(value)

    if (!value || !date.isValid() || date.isBefore(limit)) {
      const deleteRequest = {
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: i + 1,
            endIndex: i + 2,
          },
        },
      }

      deleteRequests.push(deleteRequest)
    }
  })

  if (!deleteRequests.length) return

  const resource = {
    requests: deleteRequests.reverse(),
  }
  const updateRequest = {
    spreadsheetId,
    resource,
  }
  return spreadsheets.batchUpdate(sheets, updateRequest)
}

module.exports = {
  appendData,
}
