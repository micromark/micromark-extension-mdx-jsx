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
 * @property {boolean} preferInline
 *   Whether to parse text in flow elements as inline.
 */

import {ok as assert} from 'devlop'
import {markdownLineEnding, markdownSpace} from 'micromark-util-character'
import {factorySpace} from 'micromark-factory-space'
import {codes, types} from 'micromark-util-symbol'
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
  const selfConstruct = {name: 'mdxJsxFlowTag', tokenize: tokenizeJsxFlow, concrete: !options.preferInline}
  
  return selfConstruct

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
      if (code === codes.eof) {
        return ok(code);
      }

      if (!options.preferInline) {
        // We want to allow expressions directly after tags.
        // See <https://github.com/micromark/micromark-extension-mdx-expression/blob/d5d92b9/packages/micromark-extension-mdx-expression/dev/lib/syntax.js#L183>
        // for more info.
        const leftBraceValue = self.parser.constructs.flow[codes.leftCurlyBrace]
        /* c8 ignore next 5 -- always a list when normalized. */
        const constructs = Array.isArray(leftBraceValue)
          ? leftBraceValue
          : leftBraceValue
            ? [leftBraceValue]
            : []
        const expression = constructs.find((d) => d.name === 'mdxFlowExpression')

        if (code === codes.lessThan) {
          // Another tag.
          // We can’t just say: fine. Lines of blocks have to be parsed until an eol/eof.
          return start(code);
        } else if (code === codes.leftCurlyBrace && expression) {
          return effects.attempt(expression, end, nok)(code);
        } else if (markdownLineEnding(code)) {
          return ok(code);
        } else {
          return nok(code);
        }
      } else {
        if (markdownLineEnding(code)) {
          effects.enter(types.lineEnding);
          effects.consume(code);
          effects.exit(types.lineEnding);
          return newlineAfterTag;
        } else {
          return maybeText(code);
        }
      }
    }

    /**
     * Handle content after newline following jsxFlowTag.
     *
     * ```markdown
     * > | <A>\n
     *          ^
     * ```
     *
     * @type {State} 
     */
    function newlineAfterTag(code) {
      if (markdownSpace(code)) {
        // handle indent
        return factorySpace(effects, newlineAfterTag, types.linePrefix)(code);
      }
      
      if (markdownLineEnding(code) || code === codes.eof) {
        return ok(code);
      }

      return maybeText(code);
    }

    /**
     * Handle something that might be text after jsxFlowTag.
     *
     * ```markdown
     * > | <div>something
     *          ^
     * > | <div><span>
     *          ^
     * ```
     *
     * @type {State}
     */
    function maybeText(code) {
      if (markdownSpace(code)) {
        // handle indent
        return factorySpace(effects, maybeText, types.linePrefix)(code);
      }

      if (code === codes.eof) {
        return ok(code);
      }

      if (code === codes.lessThan) {
        // try next tag, or text
        return effects.check(selfConstruct, start, textStart)(code);
      }

      return textStart(code);
    }

    /**
     * Handle start of text.
     *
     * ```markdown
     * > | <div>hello
     *          ^
     * ```
     *
     * @type {State}
     */
    function textStart(code) {
      effects.enter('chunkText', { contentType: 'text' });
      return textContinuation(code);
    }

    /**
     * Handle text after jsxFlowTag.
     *
     * ```markdown
     * > | <div>blah</div>
     *          ^^^^
     * ```
     *
     * @type {State}
     */
    function textContinuation(code) {
      if (code === codes.lessThan) {
        // try parse tag
        return effects.check(
          selfConstruct,
          code => {
            effects.exit('chunkText');
            return start(code);
          },
          code => {
            effects.consume(code);
            return textContinuation;
          }
        )(code);
      }

      // </div>something (EOF) is an invalid flow block
      if (code === codes.eof) {
        return nok(code);
      }

      if (markdownLineEnding(code)) {
        effects.exit('chunkText');
        effects.enter('lineEnding');
        effects.consume(code);
        effects.exit('lineEnding');
        return textNewlineContinuation;
      }

      // continue
      effects.consume(code);
      return textContinuation;
    }

    /**
     * Handle after newline in textContinuation.
     * 
     * ```markdown
     *   | <div>
     *   |   hello
     * > |
     *     ^
     * ```
     *   
     * @type {State}
     */
    function textNewlineContinuation(code) {
      if (markdownSpace(code)) {
        // handle indent
        return factorySpace(effects, textNewlineContinuation, types.linePrefix)(code);
      } else if (markdownLineEnding(code)) {
        // cannot end block here
        return nok(code);
      } else {
        return maybeText(code);
      }
    }
  }
}
