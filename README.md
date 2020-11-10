# server-timing

[![Build Status](https://travis-ci.org/yosuke-furukawa/server-timing.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/server-timing)
[![Coverage Status](https://coveralls.io/repos/github/yosuke-furukawa/server-timing/badge.svg?branch=improve_coverage)](https://coveralls.io/github/yosuke-furukawa/server-timing?branch=improve_coverage)

This module adds [Server-Timing](https://www.w3.org/TR/server-timing/) to response headers.
Example is [here](https://server-timing.now.sh/) and open chrome devtool network tab.

You can use this as a express module / basic http function.

# Install

```
$ npm install server-timing -S
```

# Usage

```javascript
const express = require('express');
const serverTiming = require('server-timing');

const app = express();
app.use(serverTiming());

app.use((req, res, next) => {
  res.startTime('file', 'File IO metric');
  setTimeout(() => {
    res.endTime('file');
  }, 100);
  next();
});
app.use((req, res, next) => {
  // you can see test end time response
  res.startTime('test', 'forget to call endTime');
  next();
});
app.use((req, res, next) => {
  // All timings should be in milliseconds (s). See issue #9 (https://github.com/yosuke-furukawa/server-timing/issues/9).
  res.setMetric('db', 100.0, 'Database metric');
  res.setMetric('api', 200.0, 'HTTP/API metric');
  res.setMetric('cache', 300.0, 'cache metric');
  next();
});
app.use((req, res, next) => {
  res.send('hello');
});
```

## Conditionally enabled

```javascript
const express = require('express');
const serverTiming = require('server-timing');

const app = express();
app.use(serverTiming({
  // Only send metrics if query parameter `debug` is set to `true`
  enabled: (req, res) => req.query.debug === 'true'
}));
```

# API

## constructor(options)

- options.name: string, default `total`, name for the timing item
- options.description: string, default `Total Response Time`, explanation for the timing item
- options.total: boolean, default `true`, add total response time
- options.enabled: boolean | function, default `true`, enable server timing header. If a function is passed, it will be called with two arguments, `request` and `response`, and should return a boolean.
- options.autoEnd: boolean, default `true` automatically endTime is called if timer is not finished.
- options.precision: number, default `+Infinity`, number of decimals to use for timings.

# Result

![image](https://cloud.githubusercontent.com/assets/555645/22737265/b5b5204e-ee45-11e6-82c5-776a5313d120.png)
