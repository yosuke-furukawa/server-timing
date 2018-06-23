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

# API

## constructor(options)

- options.total: boolean, default `true`
- options.enabled: boolean, default `true`

# Result

![image](https://cloud.githubusercontent.com/assets/555645/22737265/b5b5204e-ee45-11e6-82c5-776a5313d120.png)
