import dayjs from 'dayjs'
import type { sheets_v4 } from 'googleapis'
import columnNumberToName from './column_number_to_name'
import * as spreadsheets from './spreadsheet_api'
import validateOptions, { type SpreadsheetOptions } from './validate_options'
import valueArray, { type DataRecord } from './value_array'

// Re-export types for consumers
export type { SpreadsheetOptions, DataRecord }

type SheetsClient = sheets_v4.Sheets

const spreadsheetApiVersion = 'v4' as const

export type AppendDataOptions = SpreadsheetOptions & {
  sheet?: string
  retention?: number
}

export type SetKeyValuesOptions = SpreadsheetOptions & {
  sheet?: string
  keyName?: string
}

export type DataWithDate = DataRecord & {
  date?: string
}

export const appendData = async (
  data: DataWithDate,
  options: AppendDataOptions,
): Promise<void> => {
  validateOptions(options)

  // set defaults
  data.date = data.date || dayjs().format('YYYY-MM-DD HH:mm')
  options.sheet = options.sheet || ''
  options.retention = options.retention || 14

  const auth = await spreadsheets.authorize(options)
  const sheets = spreadsheets.client(auth, spreadsheetApiVersion)

  const sheetId = await makeSureSheetExists(sheets, options)

  const dataHeaders = Object.keys(data).filter(
    (h) => h !== 'undefined' && h !== 'date',
  )
  dataHeaders.unshift('date')
  const sheetHeaders = await makeSureHeadersExist(sheets, dataHeaders, options)
  if (!sheetHeaders.length || sheetHeaders[0] !== 'date') {
    throw new Error("The first column header must be 'date'")
  }

  await appendDataToSheet(sheets, data, sheetHeaders, options)

  await purgeRows(sheets, sheetId, options)
}

export const setKeyValues = async (
  data: DataRecord,
  options: SetKeyValuesOptions,
): Promise<void> => {
  validateOptions(options)

  // set defaults
  options.sheet = options.sheet || ''
  options.keyName = options.keyName || 'key'

  const auth = await spreadsheets.authorize(options)
  const sheets = spreadsheets.client(auth, spreadsheetApiVersion)

  await makeSureSheetExists(sheets, options)

  const dataHeaders = Object.keys(data).filter((h) => h !== 'undefined')
  const sheetHeaders = await makeSureHeadersExist(sheets, dataHeaders, options)

  const updated = await updateRowIfExists(sheets, data, sheetHeaders, options)
  if (!updated) {
    await appendDataToSheet(sheets, data, sheetHeaders, options)
  }
}

const makeSureSheetExists = async (
  sheets: SheetsClient,
  options: SpreadsheetOptions,
): Promise<number> => {
  const { spreadsheetId } = options
  if (!options.sheet) return 0

  const res = await spreadsheets.get(sheets, { spreadsheetId })
  const found = res.sheets?.find((s) => s.properties?.title === options.sheet)
  if (found) return found.properties?.sheetId ?? 0

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
  const reply = sheet.replies?.[0]
  return reply?.addSheet?.properties?.sheetId ?? 0
}

const makeSureHeadersExist = async (
  sheets: SheetsClient,
  dataHeaders: string[],
  options: SpreadsheetOptions,
): Promise<string[]> => {
  const { spreadsheetId, sheet } = options
  const numberOfColumnsToCheck = 100

  const rangeLimit = columnNumberToName(numberOfColumnsToCheck)
  const request = {
    spreadsheetId,
    range: `${sheet}!A1:${rangeLimit}1`,
  }

  const getRes = await spreadsheets.valuesGet(sheets, request)

  const sheetHeaders = (getRes.values?.[0] as string[]) || []
  const missingHeaders = dataHeaders.filter((h) => !sheetHeaders.includes(h))
  if (!missingHeaders.length) return sheetHeaders

  const firstFreeColumnNumber = sheetHeaders.length + 1
  const firstFreeColumnName = columnNumberToName(firstFreeColumnNumber)

  const appendRequest = {
    spreadsheetId,
    range: `${sheet}!${firstFreeColumnName}1`,
    valueInputOption: 'RAW',
    resource: {
      values: [missingHeaders],
    },
  }
  await spreadsheets.valuesAppend(sheets, appendRequest)

  return sheetHeaders.concat(missingHeaders)
}

const appendDataToSheet = async (
  sheets: SheetsClient,
  data: DataRecord,
  headers: string[],
  options: SpreadsheetOptions,
): Promise<void> => {
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

  await spreadsheets.valuesAppend(sheets, appendRequest)
}

const purgeRows = async (
  sheets: SheetsClient,
  sheetId: number,
  options: AppendDataOptions,
): Promise<void> => {
  const { spreadsheetId, sheet } = options
  const numberOfRowsToCheck = 1000

  const request = {
    spreadsheetId,
    range: `${sheet}!A2:A${numberOfRowsToCheck + 1}`,
  }

  const getRes = await spreadsheets.valuesGet(sheets, request)
  if (!getRes.values) return

  const limit = dayjs().subtract(options.retention ?? 14, 'days')
  const deleteRequests: sheets_v4.Schema$Request[] = []
  getRes.values.forEach((values, i) => {
    const [value] = values as string[]
    const date = dayjs(value)

    if (!value || !date.isValid() || date.isBefore(limit)) {
      const deleteRequest: sheets_v4.Schema$Request = {
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
  await spreadsheets.batchUpdate(sheets, updateRequest)
}

const updateRowIfExists = async (
  sheets: SheetsClient,
  data: DataRecord,
  sheetHeaders: string[],
  options: SetKeyValuesOptions,
): Promise<boolean> => {
  const { spreadsheetId, sheet } = options
  const numberOfRowsToCheck = 1000
  const keyName = options.keyName ?? 'key'
  const key = data[keyName]

  if (!key) {
    throw new Error(
      `Key is not specified. Set a value for "${keyName}" or specify "options.keyName" to use a different attribute as key.`,
    )
  }

  const request = {
    spreadsheetId,
    range: `${sheet}!A2:A${numberOfRowsToCheck + 1}`,
  }

  const getRes = await spreadsheets.valuesGet(sheets, request)
  if (!getRes.values) return false

  const index = getRes.values.findIndex((values) => {
    const [value] = values as string[]
    return value === key
  })

  if (index === -1) return false

  const values = valueArray(data, sheetHeaders)
  const updateRequest = {
    spreadsheetId,
    range: `${sheet}!A${index + 2}`,
    valueInputOption: 'RAW',
    resource: {
      majorDimension: 'ROWS',
      values: [values],
    },
  }

  await spreadsheets.valuesUpdate(sheets, updateRequest)

  return true
}
