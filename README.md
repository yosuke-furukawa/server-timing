# server-timing

[![Build Status](https://travis-ci.org/yosuke-furukawa/server-timing.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/server-timing)
[![Coverage Status](https://coveralls.io/repos/github/yosuke-furukawa/server-timing/badge.svg?branch=improve_coverage)](https://coveralls.io/github/yosuke-furukawa/server-timing?branch=improve_coverage)

This module adds [Server-Timing](https://www.w3.org/TR/server-timing/) to HTTP response headers.
An example is available [here](https://server-timing.now.sh/). To see the Server-Timing headers in action, open the network tab in your browser's developer tools when viewing the example.

This module can be used as an Express middleware or with Node.js's basic HTTP module.

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
  // Example: A timer started but not explicitly ended (if autoEnd is true).
  res.startTime('test', 'forget to call endTime');
  next();
});
app.use((req, res, next) => {
  // Server-Timing headers expect timing values in milliseconds. Ensure all metrics are provided in milliseconds. See issue #9 (https://github.com/yosuke-furukawa/server-timing/issues/9) for more context.
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
  // Example: Only send Server-Timing headers if a 'debug' query parameter is true.
  enabled: (req, res) => req.query.debug === 'true'
}));
```

# API

## constructor(options)

- `options.name`: string, default `'total'`. The name for the primary timing metric, often representing the total request processing time.
- `options.description`: string, default `'Total Response Time'`. A human-readable description for the primary timing metric.
- `options.total`: boolean, default `true`. If `true`, automatically includes a metric for the total response time.
- `options.enabled`: boolean | function, default `true`. Controls whether Server-Timing headers are added. If a function is provided, it's called with `request` and `response` objects and must return a boolean to determine if headers should be sent for the current request.
- `options.autoEnd`: boolean, default `true`. If `true`, `endTime()` is automatically called for any timers that were started with `startTime()` but not explicitly ended before the response finishes.
- `options.precision`: number, default `+Infinity`. Specifies the number of decimal places to use for timing values in the Server-Timing header.

# Example Result

The Server-Timing headers will appear in the browser's developer tools, typically in the Network tab when inspecting a response. Here's an example of how it might look:

![image](https://cloud.githubusercontent.com/assets/555645/22737265/b5b5204e-ee45-11e6-82c5-776a5313d120.png)
