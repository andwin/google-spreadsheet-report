const { google } = require('googleapis')

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

const client = (auth, version) => google.sheets({ version, auth })

const get = (sheets, options) => new Promise((resolve, reject) => {
  sheets.spreadsheets.get(options, (err, res) => {
    if (err) return reject(err)

    resolve(res)
  })
})

const batchUpdate = (sheets, request) => new Promise((resolve, reject) => {
  sheets.spreadsheets.batchUpdate(request, (err, sheet) => {
    if (err) return reject(err)

    resolve(sheet)
  })
})

const valuesGet = (sheets, request) => new Promise((resolve, reject) => {
  sheets.spreadsheets.values.get(request, (err, response) => {
    if (err) return reject(err)

    resolve(response)
  })
})

const valuesAppend = (sheets, request) => new Promise((resolve, reject) => {
  sheets.spreadsheets.values.append(request, (err, response) => {
    if (err) return reject(err)

    resolve(response)
  })
})

const valuesUpdate = (sheets, request) => new Promise((resolve, reject) => {
  sheets.spreadsheets.values.update(request, (err, response) => {
    if (err) return reject(err)

    resolve(response)
  })
})

module.exports = {
  authorize,
  client,
  get,
  batchUpdate,
  valuesGet,
  valuesAppend,
  valuesUpdate,
}
