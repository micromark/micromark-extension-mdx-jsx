'use strict'

exports.start = start
exports.cont = cont

var fromCharCode = require('micromark/dist/constant/from-char-code')
var id = require('./util-identifier-regex')

// To do: support astrals.
function start(code) {
  return id.start.test(fromCharCode(code))
}

// To do: support astrals.
function cont(code) {
  var character = fromCharCode(code)
  return id.start.test(character) || id.cont.test(character)
}
