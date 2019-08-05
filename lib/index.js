const dayjs = require('dayjs')
const { google } = require('googleapis')
const columnNumberToName = require('../utils/columnNumberToName')
const valueArray = require('../utils/valueArray')
const validateOptions = require('./validateOptions')

/*
options
  email
  key
  spreadsheetId
  sheet - optional
  retention in days - optional - 14 default
*/
const appendData = async (data, options) => {
  validateOptions(options)

  // set defaults
  data.date = data.date || dayjs().format('YYYY-MM-DD HH:mm')
  options.sheet = options.sheet || ''
  options.retention = options.retention || 14

  const auth = await authorize(options)
  const version = 'v4'
  const sheets = google.sheets({ version, auth })

  const sheetId = await makeSureSheetExists(sheets, options)

  const headers = await makeSureHeadersExist(sheets, data, options)

  await appendDataToSheet(sheets, data, headers, options)

  await purgeRows(sheets, sheetId, options)
}

const authorize = (options) => {
  const url = 'https://spreadsheets.google.com/feeds/'
  const authClient = new google.auth.JWT(
    options.email,
    null,
    options.key,
    [url],
  )

  return new Promise(((resolve, reject) => {
    authClient.authorize((err) => {
      if (err) return reject(err)

      resolve(authClient)
    })
  }))
}

const makeSureSheetExists = (sheets, options) => {
  const { spreadsheetId } = options

  return new Promise((resolve, reject) => {
    if (!options.sheet) return resolve(0)

    sheets.spreadsheets.get({ spreadsheetId }, (getErr, res) => {
      if (getErr) return reject(getErr)

      const found = res.data.sheets.find(s => s.properties.title === options.sheet)
      if (found) return resolve(found.properties.sheetId)

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
      sheets.spreadsheets.batchUpdate(request, (addErr, sheet) => {
        if (addErr) return reject(addErr)

        const [reply] = sheet.data.replies
        resolve(reply.addSheet.properties.sheetId)
      })
    })
  })
}

const makeSureHeadersExist = (sheets, data, options) => {
  const headers = Object.keys(data).filter(h => h !== 'undefined' && h !== 'date')
  headers.unshift('date')
  const { spreadsheetId, sheet } = options
  const numberOfColumnsToCheck = 100

  return new Promise((resolve, reject) => {
    const rangeLimit = columnNumberToName(numberOfColumnsToCheck)
    const request = {
      spreadsheetId,
      range: `${sheet}!A1:${rangeLimit}1`,
    }

    sheets.spreadsheets.values.get(request, (getErr, getRes) => {
      if (getErr) return reject(getErr)

      const [sheetHeaders] = getRes.data.values || [[]]
      const missingHeaders = headers.filter(h => !sheetHeaders.includes(h))
      if (!missingHeaders.length) return resolve(sheetHeaders)

      if (sheetHeaders.length && sheetHeaders[0] !== 'date') {
        return reject(new Error('The first column header must be \'date\''))
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

      sheets.spreadsheets.values.append(appendRequest, (appendErr) => {
        if (appendErr) return reject(appendErr)

        resolve(sheetHeaders.concat(missingHeaders))
      })
    })
  })
}

const appendDataToSheet = (sheets, data, headers, options) => {
  const { spreadsheetId, sheet } = options
  return new Promise((resolve, reject) => {
    const values = valueArray(data, headers)
    const appendRequest = {
      spreadsheetId,
      range: `${sheet}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    }

    sheets.spreadsheets.values.append(appendRequest, (appendErr) => {
      if (appendErr) return reject(appendErr)

      resolve()
    })
  })
}

const purgeRows = (sheets, sheetId, options) => {
  const { spreadsheetId, sheet } = options
  const numberOfRowsToCheck = 1000

  return new Promise((resolve, reject) => {
    const request = {
      spreadsheetId,
      range: `${sheet}!A2:A${numberOfRowsToCheck + 1}`,
    }

    sheets.spreadsheets.values.get(request, (getErr, getRes) => {
      if (getErr) return reject(getErr)
      if (!getRes.data.values) return resolve()

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

      if (!deleteRequests.length) return resolve()

      const resource = {
        requests: deleteRequests.reverse(),
      }
      sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource,
      }, (deleteErr) => {
        if (deleteErr) return reject(deleteErr)

        resolve()
      })
    })
  })
}

module.exports = {
  appendData,
}
