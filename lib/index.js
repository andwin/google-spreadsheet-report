const dayjs = require('dayjs')
const { google } = require('googleapis')
const columnNumberToName = require('../utils/columnNumberToName')
const valueArray = require('../utils/valueArray')

/*
options
  email
  key
  spreadsheetId
  worksheet
*/
const appendData = async (data, options) => {
  // Validate options

  // set defaults - extract
  data.date = data.date || dayjs().format()
  options.baseUrl = options.baseUrl || 'https://spreadsheets.google.com/feeds/'

  const auth = await authorize(options)
  const version = 'v4'
  const sheets = google.sheets({ version, auth })

  await makeSureSheetExists(sheets, options)

  const headers = await makeSureHeadersExist(sheets, data, options)

  await appendDataToSheet(sheets, data, headers, options)
}

const authorize = (options) => {
  const authClient = new google.auth.JWT(
    options.email,
    null,
    options.key,
    [options.baseUrl],
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
    sheets.spreadsheets.get({ spreadsheetId }, (getErr, res) => {
      if (getErr) return reject(getErr)

      const found = res.data.sheets.some(s => s.properties.title === options.worksheet)
      if (found) return resolve()

      if (!found) {
        const request = {
          spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: options.worksheet,
                  },
                },
              },
            ],
          },
        }
        sheets.spreadsheets.batchUpdate(request, (addErr) => {
          if (addErr) return reject(addErr)

          resolve()
        })
      }
    })
  })
}

const makeSureHeadersExist = (sheets, data, options) => {
  const headers = Object.keys(data).filter(h => h !== 'undefined' && h !== 'date')
  headers.unshift('date')
  const { spreadsheetId, worksheet } = options
  const numberOfColumnsToCheck = 100

  return new Promise((resolve, reject) => {
    const rangeLimit = columnNumberToName(numberOfColumnsToCheck)
    const request = {
      spreadsheetId,
      range: `${worksheet}!A1:${rangeLimit}1`,
    }

    sheets.spreadsheets.values.get(request, (getErr, getRes) => {
      if (getErr) return reject(getErr)

      const [sheetHeaders] = getRes.data.values || [[]]
      const missingHeaders = headers.filter(h => !sheetHeaders.includes(h))
      if (!missingHeaders.length) return resolve(sheetHeaders)

      const firstFreeColumnNumber = sheetHeaders.length + 1
      const firstFreeColumnName = columnNumberToName(firstFreeColumnNumber)

      const appendRequest = {
        spreadsheetId,
        range: `${worksheet}!${firstFreeColumnName}1`,
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
  const { spreadsheetId, worksheet } = options
  return new Promise((resolve, reject) => {
    const values = valueArray(data, headers)
    const appendRequest = {
      spreadsheetId,
      range: `${worksheet}!A1`,
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

module.exports = {
  appendData,
}
