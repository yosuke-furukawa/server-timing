'use strict'

const onHeaders = require('on-headers')
const Timer = require('./timer')

module.exports = function serverTiming(options) {
  const opts = Object.assign({
    total: true,
    enabled: true
  }, options);
  return (_, res, next) => {
    const headers = []
    const timer = new Timer()
    if (res.setMetric) {
      throw new Error('res.setMetric already exists.')
    }

    const startAt = process.hrtime()

    res.setMetric = setMetric(headers)
    res.startTime = startTime(timer)
    res.endTime = endTime(timer, res)

    onHeaders(res, () => {
      if (opts.total) {
        const diff = process.hrtime(startAt)
        const timeSec = (diff[0] * 1E3) + (diff[1] * 1e-6)
        headers.push(`total; dur=${timeSec}; desc="Total Response Time"`)
      }
      timer.clear()

      if (opts.enabled) {
        const existingHeaders = res.getHeader('Server-Timing')
        res.setHeader('Server-Timing', [].concat(existingHeaders || []).concat(headers).join(', '))
      }
    })
    if (typeof next === 'function') {
      next()
    }
  }
}

function setMetric(headers) {
  return (name, value, description) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }
    if (typeof value !== 'number') {
      return console.warn('2nd argument value is not number')
    }

    const metric = typeof description !== 'string' || !description ?
      `${name}; dur=${value}` : `${name}; dur=${value}; desc="${description}"`

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

function endTime(timer, res) {
  return (name) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }

    const obj = timer.timeEnd(name)
    if (!obj) {
      return
    }
    res.setMetric(obj.name, obj.value, obj.description)
  }
}