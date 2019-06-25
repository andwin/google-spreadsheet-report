# google-spreadsheet-report
A simple library to append data to a google spreadsheet.

## Quickstart

```
npm install google-spreadsheet-report --save
```

```javascript
const dayjs = require('dayjs')
const gsr = require('../google-spreadsheet-report')

const options = {
  email: 'test-579@rock-arc-1124354.iam.gserviceaccount.com',
  key: `-----BEGIN PRIVATE KEY-----
Private key here
-----END PRIVATE KEY-----`,
  spreadsheetId: '<spreadsheetId>',
  worksheet: '<name of workshet>', // Optional
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

This would produce a spreadsheet looking something like this:

date | val1 | val2
-----|------|-----
2019-06-02 | 34 | 759

The worksheet is created if it doesn't exist. Any missing column headers are also added.

## Generating credentials
1. Log in to the [Google Developer Console](https://console.developers.google.com/)
2. Create a project new project och select an existing one
3. Open "Library" tab and enable the "Google Drive API"
4. Go back to the [Google Developer Console](https://console.developers.google.com/) and open the "Credentials" tab
5. Create a "Service account key"
6. Copy the service account id (Someting like "test-579@rock-arc-1124354.iam.gserviceaccount.com")
7. Select "P12" and click "Create" and then "Create without role"
8. The p12-file should now be downloaded to your computer
9. Convert the p12 file into pem format\
  `openssl pkcs12 -in <filename.p12> -nodes -nocerts > key.pem`\
  when prompted for password, enter `notasecret`
10. Create a new spreadsheet and share it (using the *Share* button) with the service email from step 6
11. Get the spreadsheet id from the url. For example if the url is\
  `https://docs.google.com/spreadsheets/d/1IeEaLOGLuIcy5oPN-OZlxzYwPYRuzVnlrpDlqkzWtOk/edit#gid=0`\
  the id is `1IeEaLOGLuIcy5oPN-OZlxzYwPYRuzVnlrpDlqkzWtOk`
12. Now you have everything you need. Create the options object wiht the email, key and spreadsheet id 
```
const options = {
  email: 'test-579@rock-arc-1124354.iam.gserviceaccount.com',
  key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDDVa....
-----END PRIVATE KEY-----`,
  spreadsheetId: '1IeEaLOGLuIcy5oPN-OZlxzYwPYRuzVnlrpDlqkzWtOk',
}
```
