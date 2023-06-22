/**
 * @typedef {import('micromark-factory-mdx-expression').Acorn} Acorn
 * @typedef {import('micromark-factory-mdx-expression').AcornOptions} AcornOptions
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {AcornOptions | undefined} acornOptions
 *   Acorn options.
 * @property {boolean | undefined} addResult
 *   Whether to add `estree` fields to tokens with results from acorn.
 */

import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {factorySpace} from 'micromark-factory-space'
import {codes, types} from 'micromark-util-symbol'
import {ok as assert} from 'uvu/assert'
import {factoryTag} from './factory-tag.js'

/**
 * Parse JSX (flow).
 *
 * @param {Acorn | undefined} acorn
 *   Acorn parser to use (optional).
 * @param {Options} options
 *   Configuration.
 * @returns {Construct}
 *   Construct.
 */
export function jsxFlow(acorn, options) {
  return {tokenize: tokenizeJsxFlow, concrete: true}

  /**
   * MDX JSX (flow).
   *
   * ```markdown
   * > | <A />
   *     ^^^^^
   * ```
   *
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeJsxFlow(effects, ok, nok) {
    const self = this

    return start

    /**
     * Start of MDX: JSX (flow).
     *
     * ```markdown
     * > | <A />
     *     ^
     * ```
     *
     * @type {State}
     */
    function start(code) {
      // To do: in `markdown-rs`, constructs need to parse the indent themselves.
      // This should also be introduced in `micromark-js`.
      assert(code === codes.lessThan, 'expected `<`')
      return before(code)
    }

    /**
     * After optional whitespace, before of MDX JSX (flow).
     *
     * ```markdown
     * > | <A />
     *     ^
     * ```
     *
     * @type {State}
     */
    function before(code) {
      return factoryTag.call(
        self,
        effects,
        after,
        nok,
        acorn,
        options.acornOptions,
        options.addResult,
        false,
        'mdxJsxFlowTag',
        'mdxJsxFlowTagMarker',
        'mdxJsxFlowTagClosingMarker',
        'mdxJsxFlowTagSelfClosingMarker',
        'mdxJsxFlowTagName',
        'mdxJsxFlowTagNamePrimary',
        'mdxJsxFlowTagNameMemberMarker',
        'mdxJsxFlowTagNameMember',
        'mdxJsxFlowTagNamePrefixMarker',
        'mdxJsxFlowTagNameLocal',
        'mdxJsxFlowTagExpressionAttribute',
        'mdxJsxFlowTagExpressionAttributeMarker',
        'mdxJsxFlowTagExpressionAttributeValue',
        'mdxJsxFlowTagAttribute',
        'mdxJsxFlowTagAttributeName',
        'mdxJsxFlowTagAttributeNamePrimary',
        'mdxJsxFlowTagAttributeNamePrefixMarker',
        'mdxJsxFlowTagAttributeNameLocal',
        'mdxJsxFlowTagAttributeInitializerMarker',
        'mdxJsxFlowTagAttributeValueLiteral',
        'mdxJsxFlowTagAttributeValueLiteralMarker',
        'mdxJsxFlowTagAttributeValueLiteralValue',
        'mdxJsxFlowTagAttributeValueExpression',
        'mdxJsxFlowTagAttributeValueExpressionMarker',
        'mdxJsxFlowTagAttributeValueExpressionValue'
      )(code)
    }

    /**
     * After an MDX JSX (flow) tag.
     *
     * ```markdown
     * > | <A>
     *        ^
     * ```
     *
     * @type {State}
     */
    function after(code) {
      return markdownSpace(code)
        ? factorySpace(effects, end, types.whitespace)(code)
        : end(code)
    }

    /**
     * After an MDX JSX (flow) tag, after optional whitespace.
     *
     * ```markdown
     * > | <A> <B>
     *         ^
     * ```
     *
     * @type {State}
     */
    function end(code) {
      // Another tag.
      return code === codes.lessThan
        ? start(code)
        : code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : nok(code)
    }
  }
}
