'use strict'

const test = require('eater/runner').test
const http = require('http')
const express = require('express')
const serverTiming = require('../.')
const assert = require('assert')
const mustCall = require('must-call')
const AssertStream = require('assert-stream')

test('express use startTime/endTime', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.startTime('hoge', 'Hoge')
    setTimeout(() => {
      res.endTime('hoge')
      next()
    }, 1000)
  })
  app.use((req, res, next) => {
    res.send('hello')
  })
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/^hoge; dur=.*; desc="Hoge", total; dur=.*; desc="Total Response Time"$/.test(res.headers['server-timing']))
      server.close()
    }))
  })
})

test('express use startTime/endTime multiple', () => {
  const app = express()
  app.use(serverTiming())
  app.use((req, res, next) => {
    res.startTime('hoge', 'Hoge')
    setTimeout(() => {
      res.endTime('hoge')
      next()
    }, 1000)
  })
  app.use((req, res, next) => {
    res.send('hello')
  })
  const checkFunc = () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall((res) => {
      const assertStream = new AssertStream()
      assertStream.expect('hello')
      res.pipe(assertStream)
      assert(/^hoge; dur=.*; desc="Hoge", total; dur=.*; desc="Total Response Time"$/.test(res.headers['server-timing']))
      server.close()
    }))
  }
  const server = app.listen(0, () => {
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
    http.get(`http://localhost:${server.address().port}/`, mustCall(checkFunc))
  })
})

