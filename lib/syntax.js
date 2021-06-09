import {jsxText} from './jsx-text.js'
import {jsxFlow} from './jsx-flow.js'

export function mdxJsx(options = {}) {
  var acorn = options.acorn
  var addResult = options.addResult
  var acornOptions

  if (acorn) {
    if (!acorn.parseExpressionAt) {
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
    flow: {60: jsxFlow(acorn, acornOptions, addResult)},
    text: {60: jsxText(acorn, acornOptions, addResult)}
  }
}
