/**
 * @typedef {import('mdast').Root} Root
 */

import fs from 'fs'
import path from 'path'
import {zone} from 'mdast-zone'

const syntax = fs.readFileSync(path.join('script', 'grammar.html'))

export default function grammar() {
  /** @param {Root} tree */
  return function (tree) {
    zone(tree, 'grammar', (start, _, end) => {
      return [
        start,
        {type: 'html', value: '<pre><code>' + syntax + '</code></pre>'},
        end
      ]
    })
  }
}
