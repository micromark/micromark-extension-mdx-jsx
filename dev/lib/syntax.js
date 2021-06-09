import {codes} from 'micromark-util-symbol/codes.js'
import {jsxText} from './jsx-text.js'
import {jsxFlow} from './jsx-flow.js'

export function mdxJsx(options = {}) {
  const acorn = options.acorn
  const addResult = options.addResult
  let acornOptions

  if (acorn) {
    if (!acorn.parse || !acorn.parseExpressionAt) {
      throw new Error(
        'Expected a proper `acorn` instance passed in as `options.acorn`'
      )
    }

    acornOptions = Object.assign(
      {ecmaVersion: 2020, sourceType: 'module'},
      options.acornOptions || {},
      {locations: true}
    )
  } else if (options.acornOptions || addResult) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }

  return {
    flow: {[codes.lessThan]: jsxFlow(acorn, acornOptions, addResult)},
    text: {[codes.lessThan]: jsxText(acorn, acornOptions, addResult)}
  }
}
