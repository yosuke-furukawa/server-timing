'use strict'

const onHeaders = require('on-headers')
const Timer = require('./timer')

module.exports = function serverTiming (options) {
  const opts = Object.assign({
    name: 'total',
    description: 'Total Response Time',
    total: true,
    enabled: true,
    autoEnd: true,
    precision: +Infinity
  }, options)
  return (req, res, next) => {
    const headers = []
    const timer = new Timer()
    if (res.setMetric) {
      throw new Error('res.setMetric already exists.')
    }

    const startAt = process.hrtime()

    res.setMetric = setMetric(headers, opts)
    res.startTime = startTime(timer)
    res.endTime = endTime(timer, res)

    onHeaders(res, () => {
      if (opts.autoEnd) {
        const keys = timer.keys()
        for (const key of keys) {
          res.endTime(key)
        }
      }

      if (opts.total) {
        const diff = process.hrtime(startAt)
        const timeSec = (diff[0] * 1E3) + (diff[1] * 1e-6)
        res.setMetric(opts.name, timeSec, opts.description)
      }
      timer.clear()

      const enabled = typeof opts.enabled === 'function'
        ? opts.enabled(req, res)
        : opts.enabled

      if (enabled) {
        const existingHeaders = res.getHeader('Server-Timing')

        res.setHeader('Server-Timing', [].concat(existingHeaders || []).concat(headers))
      }
    })
    if (typeof next === 'function') {
      next()
    }
  }
}

function setMetric (headers, opts) {
  return (name, value, description) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }
    if (typeof value !== 'number') {
      return console.warn('2nd argument value is not number')
    }

    const dur = Number.isFinite(opts.precision)
      ? value.toFixed(opts.precision)
      : value

    const metric = typeof description !== 'string' || !description
      ? `${name}; dur=${dur}`
      : `${name}; dur=${dur}; desc="${description}"`

    headers.push(metric)
  }
}

function startTime (timer) {
  return (name, description) => {
    if (typeof name !== 'string') {
      return console.warn('1st argument name is not string')
    }

    timer.time(name, description)
  }
}

function endTime (timer, res) {
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
