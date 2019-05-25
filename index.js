const dayjs = require('dayjs')
const { google } = require('googleapis')

/*
options
  email
  key
*/
const appendData = async (data, options) => {
  // Validate options

  // set defaults - extract
  data.date = data.date || dayjs().format()
  options.baseUrl = options.baseUrl || 'https://spreadsheets.google.com/feeds/'

  const auth = await authorize(options)
  const version = 'v4'
  const sheets = google.sheets({ version, auth })

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

const appendDataToSheet = (sheets, data, options) => {
  const { spreadsheetId } = options
  return new Promise((resolve, reject) => {
    const appendRequest = {
      spreadsheetId,
      range: 'A1',
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