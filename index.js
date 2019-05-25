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

  console.log(sheets)
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

module.exports = {
  appendData,
}
