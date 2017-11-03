'use strict'

const test = require('eater/runner').test
const http = require('http')
const express = require('express')
const serverTiming = require('../.')
const assert = require('assert')
const mustCall = require('must-call')
const AssertStream = require('assert-stream')

test('express total response', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/total; duration=.*; description="Total Response Time"/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('express add some custom server timing header', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.setMetric('foo', 100.0)
    res.setMetric('bar', 10.0, 'Bar is not Foo')
    res.setMetric('baz', 0)
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      const timingHeader = res.headers['server-timing']
      assert(/total; duration=.*; description="Total Response Time"/.test(timingHeader))
      assert(/foo; duration=100, bar; duration=10; description="Bar is not Foo", baz; duration=0/.test(timingHeader))
      server.close()
    }))
  })
})

test('express request twice and check idempotent', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.setMetric('foo', 100.0)
    res.setMetric('bar', 10.0, 'Bar is not Foo')
    res.setMetric('baz', 0)
    res.send('hello')
  })
  const checkFunc = (res) => {
    const assertStream = new AssertStream()
    assertStream.expect('hello')
    res.pipe(assertStream)
    const timingHeader = res.headers['server-timing']
    assert(/^foo; duration=100, bar; duration=10; description="Bar is not Foo", baz; duration=0, total; duration=.*; description="Total Response Time"$/.test(timingHeader))
    server.close()
  }
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
  })
})

