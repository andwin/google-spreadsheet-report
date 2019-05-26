const dayjs = require('dayjs')
const { google } = require('googleapis')

/*
options
  email
  key
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

  await appendDataToSheet(sheets, data, options)
}

const authorize = (options) => {
  const authClient = new google.auth.JWT(
    options.email,
    null,
    options.key,
    [options.baseUrl]
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

      console.log({ found })

      if (found) return resolve()

      if (!found) {
        const resource = {
          requests: [
            {
              addSheet: {
                properties: {
                  title: options.worksheet,
                },
              },
            },
          ],
        }
        sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource,
        }, (addErr) => {
          if (addErr) return reject(addErr)

          resolve()
        })
      }
    })
  })
}

const appendDataToSheet = (sheets, data, options) => {
  const { spreadsheetId, worksheet } = options
  return new Promise((resolve, reject) => {
    const appendRequest = {
      spreadsheetId,
      range: `${worksheet}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [
          Object.values(data),
        ],
      },

    }
    sheets.spreadsheets.values.append(appendRequest, (appendErr, appendRes) => {
      if (appendErr) return reject(appendErr)

      // TODO: Change code below to process the `appendRes` object:
      console.log(JSON.stringify(appendRes, null, 2))

      resolve()
    })
  })
}

module.exports = {
  appendData,
}
