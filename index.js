'use strict'

const onHeaders = require('on-headers')
const headers = []

module.exports = function serverTiming (options) {
  const opts = options || { total: true }
  return (_, res, next) => {
    if (res.setMetric) {
      throw new Error('res.setMetric already exists.')
    }

    let startAt = process.hrtime()

    res.setMetric = setMetric

    onHeaders(res, () => {
      if (opts.total) {
        let diff = process.hrtime(startAt)
        let time = (diff[0] * 1e3 + diff[1] * 1e-6) / 1000
        headers.push(`total=${time}; "Total Response Time"`)
      }
      res.setHeader('Server-Timing', headers.join(', '))
    })
    if (typeof next === 'function') {
      next()
    }
  }
}

function setMetric (name, value, description) {
  if (typeof name !== 'string') {
    return console.warn('1st argument name is not string')
  }
  if (typeof value !== 'number') {
    return console.warn('2nd argument value is not number')
  }

  let metric = `${name}=${value}`

  if (typeof description === 'string') {
    metric += `; "${description}"`
  }

  headers.push(metric)
}
