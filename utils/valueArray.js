const valueArray = (data, headers) => {
  const values = headers.map((h) => data[h])

  return values
}

module.exports = valueArray
