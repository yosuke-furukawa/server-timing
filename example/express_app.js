const express = require('express')
const path = require('path')
const app = express()
const serverTiming = require('../.')
const PORT = process.env.PORT || 3000

//app.use(express.static(path.join(__dirname, 'public')))
app.use(serverTiming())
app.use((req, res, next) => {
  res.setMetric('db', 100.0, "Database metric");
  res.setMetric('api', 200.0, "HTTP/API metric");
  res.setMetric('cache', 300.0, "cache metric");
  next();
});
app.use((req, res, next) => {
  res.send('hello')
});

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`)
})
