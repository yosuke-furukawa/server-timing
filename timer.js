'use strict'

class Timer {
  constructor () {
    this._times = new Map()
  }
  time (name, description) {
    this._times.set(name, {
      name: name,
      description: description,
      start: process.hrtime()
    })
  }
  timeEnd (name) {
    const timeObj = this._times.get(name)
    if (!timeObj) {
      return console.warn(`No such name ${name}`)
    }
    const duration = process.hrtime(timeObj.start)
    const value = (duration[0] * 1E3) + (duration[1] * 1e-6)
    timeObj.value = value
    this._times.delete(name)
    return timeObj
  }
  clear () {
    this._times.clear()
  }
}

module.exports = Timer
