import { google, type sheets_v4 } from 'googleapis'
import type { SpreadsheetOptions } from './validate_options'

type SheetsClient = sheets_v4.Sheets

type GetOptions = {
  spreadsheetId: string
}

type ValuesRequest = {
  spreadsheetId: string
  range: string
  valueInputOption?: string
  resource?: {
    values?: unknown[][]
    majorDimension?: string
  }
}

type BatchUpdateRequest = {
  spreadsheetId: string
  resource: {
    requests: sheets_v4.Schema$Request[]
  }
}

type ApiResponse<T> = {
  data: T
}

export const authorize = async (
  options: SpreadsheetOptions,
): Promise<InstanceType<typeof google.auth.JWT>> => {
  const scopes = ['https://spreadsheets.google.com/feeds/']
  const authClient = new google.auth.JWT({
    email: options.email,
    key: options.key,
    scopes,
  })

  return new Promise((resolve, reject) => {
    authClient.authorize((err) => {
      if (err) return reject(err)
      resolve(authClient)
    })
  })
}

export const client = (
  auth: InstanceType<typeof google.auth.JWT>,
  version: 'v4',
): SheetsClient => google.sheets({ version, auth })

export const get = (
  sheets: SheetsClient,
  options: GetOptions,
): Promise<sheets_v4.Schema$Spreadsheet> =>
  new Promise((resolve, reject) => {
    sheets.spreadsheets.get(
      options,
      (
        err: Error | null,
        res: ApiResponse<sheets_v4.Schema$Spreadsheet> | null | undefined,
      ) => {
        if (err) return reject(err)
        if (!res) return reject(new Error('No response received'))
        resolve(res.data)
      },
    )
  })

export const batchUpdate = (
  sheets: SheetsClient,
  request: BatchUpdateRequest,
): Promise<sheets_v4.Schema$BatchUpdateSpreadsheetResponse> =>
  new Promise((resolve, reject) => {
    sheets.spreadsheets.batchUpdate(
      request,
      (
        err: Error | null,
        res:
          | ApiResponse<sheets_v4.Schema$BatchUpdateSpreadsheetResponse>
          | null
          | undefined,
      ) => {
        if (err) return reject(err)
        if (!res) return reject(new Error('No response received'))
        resolve(res.data)
      },
    )
  })

export const valuesGet = (
  sheets: SheetsClient,
  request: ValuesRequest,
): Promise<sheets_v4.Schema$ValueRange> =>
  new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get(
      request,
      (
        err: Error | null,
        response: ApiResponse<sheets_v4.Schema$ValueRange> | null | undefined,
      ) => {
        if (err) return reject(err)
        if (!response) return reject(new Error('No response received'))
        resolve(response.data)
      },
    )
  })

export const valuesAppend = (
  sheets: SheetsClient,
  request: ValuesRequest,
): Promise<sheets_v4.Schema$AppendValuesResponse> =>
  new Promise((resolve, reject) => {
    sheets.spreadsheets.values.append(
      request,
      (
        err: Error | null,
        response:
          | ApiResponse<sheets_v4.Schema$AppendValuesResponse>
          | null
          | undefined,
      ) => {
        if (err) return reject(err)
        if (!response) return reject(new Error('No response received'))
        resolve(response.data)
      },
    )
  })

export const valuesUpdate = (
  sheets: SheetsClient,
  request: ValuesRequest,
): Promise<sheets_v4.Schema$UpdateValuesResponse> =>
  new Promise((resolve, reject) => {
    sheets.spreadsheets.values.update(
      request,
      (
        err: Error | null,
        response:
          | ApiResponse<sheets_v4.Schema$UpdateValuesResponse>
          | null
          | undefined,
      ) => {
        if (err) return reject(err)
        if (!response) return reject(new Error('No response received'))
        resolve(response.data)
      },
    )
  })
