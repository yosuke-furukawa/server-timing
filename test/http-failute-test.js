'use strict'

const test = require('eater/runner').test
const http = require('http')
const serverTiming = require('../.')
const assert = require('assert')
const mustCall = require('must-call')
const AssertStream = require('assert-stream')

test('failure: res.setMetric is already defined', () => {
  const server = http.createServer((req, res) => {
    res.setMetric = () => {/* dummy */}
    try {
      serverTiming()(req, res)
    } catch(e) {
      assert(e.message === 'res.setMetric already exists.')
    }
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      server.close()
    }))
  })
})

test('failure: 1st argument is not string', () => {
  console.warn = mustCall((message) => {
    assert(message === '1st argument name is not string');
  });
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    res.setMetric()
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      server.close()
    }))
  })
})

test('failure: 2nd argument is not number', () => {
  console.warn = mustCall((message) => {
    assert(message === '2nd argument value is not number');
  });
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    res.setMetric('foo', 'test')
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      server.close()
    }))
  })
})

