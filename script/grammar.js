import fs from 'fs'
import path from 'path'
import {zone} from 'mdast-zone'

var syntax = fs.readFileSync(path.join('script', 'grammar.html'))

export default function grammar() {
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
