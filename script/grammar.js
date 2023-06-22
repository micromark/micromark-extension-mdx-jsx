/**
 * @typedef {import('mdast').Root} Root
 */

import fs from 'node:fs/promises'
import {zone} from 'mdast-zone'

const syntax = await fs.readFile(new URL('grammar.html', import.meta.url))

/** @type {import('unified').Plugin<[], Root>} */
export default function grammar() {
  return function (tree) {
    zone(tree, 'grammar', function (start, _, end) {
      return [
        start,
        {type: 'html', value: '<pre><code>' + syntax + '</code></pre>'},
        end
      ]
    })
  }
}
