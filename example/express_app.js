const express = require('express')
const app = express()
const serverTiming = require('server-timing')
const PORT = process.env.PORT || 3000

app.use(serverTiming())
app.use((req, res, next) => {
  res.setMetric('db', 100.0, 'Database metric')
  res.setMetric('api', 200.0, 'HTTP/API metric')
  res.setMetric('cache', 300.0, 'cache metric')
  next()
})
app.use((req, res, next) => {
  res.send('Open DevTools and See Network tab')
})

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`)
})
