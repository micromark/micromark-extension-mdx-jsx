import {markdownLineEnding} from 'micromark-util-character'
import {factorySpace} from 'micromark-factory-space'
import {factoryTag} from './factory-tag.js'

export function jsxFlow(acorn, acornOptions, addResult) {
  return {tokenize: tokenizeJsxFlow, concrete: true}

  function tokenizeJsxFlow(effects, ok, nok) {
    const self = this

    return start

    function start(code) {
      return factoryTag.call(
        self,
        effects,
        factorySpace(effects, after, 'whitespace'),
        nok,
        acorn,
        acornOptions,
        addResult,
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

    function after(code) {
      // Another tag.
      if (code === 60 /* `<` */) {
        return start(code)
      }

      return code === null || markdownLineEnding(code) ? ok(code) : nok(code)
    }
  }
}
