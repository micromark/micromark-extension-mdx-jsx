var fs = require('fs')
var path = require('path')
var zone = require('mdast-zone')

var syntax = fs.readFileSync(path.join(__dirname, 'grammar.html'))

module.exports = grammar

function grammar() {
  return transform
}

function transform(tree) {
  zone(tree, 'grammar', inject)
}

function inject(start, nodes, end) {
  return [
    start,
    {type: 'html', value: '<pre><code>' + syntax + '</code></pre>'},
    end
  ]
}
