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
      assert(/total; dur=.*; desc="Total Response Time"/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('custom timing name and description', () => {
  const app = express()
  app.use(serverTiming({
    name: 'app',
    description: 'Service Layer Response Time'
  }))
  app.use((req, res, next) => {
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/app; dur=.*; desc="Service Layer Response Time"/.test(res.headers['server-timing']))
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
      assert(/total; dur=.*; desc="Total Response Time"/.test(timingHeader))
      assert(/foo; dur=100, bar; dur=10; desc="Bar is not Foo", baz; dur=0/.test(timingHeader))
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
    assert(/^foo; dur=100, bar; dur=10; desc="Bar is not Foo", baz; dur=0, total; dur=.*; desc="Total Response Time"$/.test(timingHeader))
    
    completedRequests++
    if (completedRequests === 5) {
      server.close()
    }
  }
  let completedRequests = 0
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
  })
})

test('express stop automatic timer', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.startTime('hello', 'hello')
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/hello; dur=.*; desc="hello", total; dur=.*; desc="Total Response Time"/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('express stop automatic timer (without total)', () => {
  const app = express()
  app.use(serverTiming({ total: false }))
  app.use((req, res, next) => {
    res.startTime('hello', 'hello')
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/hello; dur=.*; desc="hello"$/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('express specify precision', () => {
  const app = express()
  app.use(serverTiming({ precision: 2 }))
  app.use((req, res, next) => {
    res.setMetric('manual', 100 / 3)
    res.startTime('auto')
    process.nextTick(() => {
      res.endTime('auto')
      res.send('hello')
    })
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      const timingHeader = res.headers['server-timing']
      assert(/total; dur=\d+\.\d{2}[;,]/.test(timingHeader))
      assert(/manual; dur=\d+\.\d{2}[;,]/.test(timingHeader))
      assert(/auto; dur=\d+\.\d{2}[;,]/.test(timingHeader))
      server.close()
    }))
  })
})
