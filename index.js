'use strict'

const onHeaders = require('on-headers')
const Timer = require('./timer')

module.exports = function serverTiming (options) {
  const headers = []
  const timer = new Timer()
  const opts = options || { total: true }
  return (_, res, next) => {
    if (res.setMetric) {
      throw new Error('res.setMetric already exists.')
    }

    let startAt = process.hrtime()

    res.startTime = startTime(timer)
    res.endTime = endTime(timer)
    res.setMetric = setMetric(headers)

    onHeaders(res, () => {
      if (opts.total) {
        let diff = process.hrtime(startAt)
        let timeSec = (diff[0] + diff[1] * 1e3)
        headers.push(`total=${timeSec}; "Total Response Time"`)
      }
      res.setHeader('Server-Timing', headers.join(', '))
    })
    if (typeof next === 'function') {
      next()
    }
  }
}

function setMetric (headers) {
  return (name, value, description) => {
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
}

function startTime(timer) {
  return (name, description) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }

    timer.time(name, description)
  }
}

function endTime(timer) {
  return (name) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }

    const obj = timer.timeEnd(name)
    this.setMetric(obj.name, obj.value, obj.description)
  }
}
