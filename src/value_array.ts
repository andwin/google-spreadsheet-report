export type DataRecord = Record<string, unknown>

const valueArray = (data: DataRecord, headers: string[]): unknown[] =>
  headers.map((h) => data[h])

export default valueArray
