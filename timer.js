'use strict'

class Timer {
  constructor() {
    this._times = new Map();
  }
  time(name, description) {
    this._times.set(name, {
      name: name,
      description: description,
      start: process.hrtime(),
    });
  }
  timeEnd(name) {
    const timeObj = this._times.get(name);
    if (!timeObj) {
      console.warn(`No such name ${name}`)
    }
    const duration = process.hrtime(timeObj.start)
    const value = (duration[0] + duration[1] / 1e3)
    timeObj.value = value
    this._times.delete(name)
    return timeObj
  }
}

module.exports = Timer
