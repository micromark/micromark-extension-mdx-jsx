/**
 * @typedef {import('mdast').Root} Root
 */

import fs from 'node:fs/promises'
import {zone} from 'mdast-zone'

const syntax = await fs.readFile(new URL('grammar.html', import.meta.url))

export default function grammar() {
  /** @param {Root} tree */
  return function (tree) {
    zone(tree, 'grammar', (start, _, end) => [
      start,
      {type: 'html', value: '<pre><code>' + syntax + '</code></pre>'},
      end
    ])
  }
}
