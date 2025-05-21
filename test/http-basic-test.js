'use strict'

const test = require('eater/runner').test
const http = require('http')
const { URL } = require('url')
const serverTiming = require('../.')
const assert = require('assert')
const mustCall = require('must-call')
const AssertStream = require('assert-stream')

test('success: http total response', () => {
  const server = http.createServer((req, res) => {
    serverTiming()(req, res)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/total; dur=.*; desc="Total Response Time"/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('success: http append more server timing response', () => {
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
      assert(/total; dur=.*; desc="Total Response Time"/.test(timingHeader))
      assert(/foo; dur=100, bar; dur=10; desc="Bar is not Foo", baz; dur=0/.test(timingHeader))
      server.close()
    }))
  })
})

test('success: http append more than one server timing header', () => {
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

      const serverTimingHeaders = []
      res.rawHeaders.forEach(
        (key, index) => {
          key === 'Server-Timing' && serverTimingHeaders.push(res.rawHeaders[index + 1])
        }
      )

      assert(serverTimingHeaders.length === 4)
      serverTimingHeaders.forEach(
        value => assert(
          /^\w+;\sdur=\d+(\.\d+)?(;\sdesc="[\w\s]+")?$/.test(value)
        )
      )
      server.close()
    }))
  })
})

test('success: http request twice more server timing response', () => {
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
      assert(/total; dur=.*; desc="Total Response Time"/.test(timingHeader))
      assert(/foo; dur=100, bar; dur=10; desc="Bar is not Foo", baz; dur=0/.test(timingHeader))
      http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
        const assertStream = new AssertStream()
        assertStream.expect('world')
        res.pipe(assertStream)

        const timingHeader = res.headers['server-timing']
        assert(/total; dur=.*; desc="Total Response Time"/.test(timingHeader))
        assert(/test; dur=0.1; desc="Test"/.test(timingHeader))
        server.close()
      }))
    }))
  })
})

test('success: no total response', () => {
  const server = http.createServer((req, res) => {
    serverTiming({
      total: false
    })(req, res)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(!res.headers['server-timing'])
      server.close()
    }))
  })
})

test('success: no response', () => {
  const server = http.createServer((req, res) => {
    serverTiming({
      enabled: false
    })(req, res)
    res.setMetric('foo', 100.0)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(!res.headers['server-timing'])
      server.close()
    }))
  })
})

test('success: no response (conditional)', () => {
  const server = http.createServer((req, res) => {
    serverTiming({
      enabled: req => {
        const url = new URL(req.url, `http://${req.headers.host}`)
        return url.searchParams.get('debug') === 'true'
      }
    })(req, res)
    res.setMetric('foo', 100.0)
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/?debug=true`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(res.headers['server-timing'])

      http.get(`http://localhost:${server.address().port}/?debug=false`, mustCall((res) => {
        const assertStream = new AssertStream()
        assertStream.expect('hello')
        res.pipe(assertStream)
        assert(!res.headers['server-timing'])
        server.close()
      }))
    }))
  })
})

test('success: stop automatically timer', () => {
  const server = http.createServer((req, res) => {
    serverTiming({})(req, res)
    res.startTime('foo', 'foo')
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(res.headers['server-timing'])
      assert(res.headers['server-timing'].includes('foo; dur='))
      assert(res.headers['server-timing'].includes('total; dur='))
      server.close()
    }))
  })
})

test('success: stop automatically timer (without total)', () => {
  const server = http.createServer((req, res) => {
    serverTiming({ total: false })(req, res)
    res.startTime('foo', 'foo')
    res.end('hello')
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(res.headers['server-timing'])
      assert(res.headers['server-timing'].includes('foo; dur='))
      assert(!res.headers['server-timing'].includes('total; dur='))
      server.close()
    }))
  })
})

test('success: specify precision', () => {
  const server = http.createServer((req, res) => {
    serverTiming({ precision: 3 })(req, res)
    res.setMetric('manual', 100 / 3)
    res.startTime('auto')
    process.nextTick(() => {
      res.endTime('auto')
      res.end('hello')
    })
  }).listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      const timingHeader = res.headers['server-timing']
      assert(timingHeader)
      assert(/total; dur=\d+\.\d{3}[;,]/.test(timingHeader))
      assert(/manual; dur=\d+\.\d{3}[;,]/.test(timingHeader))
      assert(/auto; dur=\d+\.\d{3}[;,]/.test(timingHeader))
      server.close()
    }))
  })
})
