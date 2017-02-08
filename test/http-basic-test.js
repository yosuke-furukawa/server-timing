'use strict'

const test = require('eater/runner').test
const http = require('http')
const serverTiming = require('../.')
const assert = require('assert')
const mustCall = require('must-call')
const AssertStream = require('assert-stream')

test('http total response', () => {
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/total=.*; "Total Response Time"/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('http append more server timing response', () => {
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    res.setMetric('foo', 100.0)
    res.setMetric('bar', 10.0, 'Bar is not Foo')
    res.setMetric('baz', 0)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)

      const timingHeader = res.headers['server-timing']
      assert(/total=.*; "Total Response Time"/.test(timingHeader))
      assert(/foo=100, bar=10; "Bar is not Foo", baz=0/.test(timingHeader))
      server.close()
    }))
  })
})

test('http request twice more server timing response', () => {
  let count = 0
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    if (count === 0) {
      res.setMetric('foo', 100.0)
      res.setMetric('bar', 10.0, 'Bar is not Foo')
      res.setMetric('baz', 0)
      res.end('hello')
    }
    if (count === 1) {
      res.setMetric('test', 0.10, 'Test')
      res.end('world')
    }
    count++
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)

      const timingHeader = res.headers['server-timing']
      assert(/total=.*; "Total Response Time"/.test(timingHeader))
      assert(/foo=100, bar=10; "Bar is not Foo", baz=0/.test(timingHeader))
      http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
        const assertStream = new AssertStream()
        assertStream.expect('world')
        res.pipe(assertStream)

        const timingHeader = res.headers['server-timing']
        assert(/total=.*; "Total Response Time"/.test(timingHeader))
        assert(/test=0.1; "Test"/.test(timingHeader))
        server.close()
      }))
    }))
  })
})
