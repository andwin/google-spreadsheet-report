# google-spreadsheet-report
A simple library to append data to a google spreadsheet.

## Quickstart

```
npm install google-spreadsheet-report --save
```

```
const dayjs = require('dayjs')
const gsr = require('../google-spreadsheet-report')

const options = {
  email: '???@????.iam.gserviceaccount.com',
  key: `-----BEGIN PRIVATE KEY-----
Private key here
-----END PRIVATE KEY-----`,
  spreadsheetId: '<spreadsheetId>',
  worksheet: '<name of workshet>',
}

const data = {
  date: dayjs().format('YYYY-MM-DD'),
  val1: Math.floor(Math.random() * 50),
  val2: Math.floor(Math.random() * 1000),
}

const run = async () => {
  try {
    await gsr.appendData(data, options)
  } catch (e) {
    console.error(e)
  }
}

run()
```
