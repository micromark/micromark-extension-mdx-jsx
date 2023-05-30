/**
 * @typedef {import('estree').Node} Node
 * @typedef {import('estree').Program} Program
 * @typedef {import('micromark-util-types').CompileContext} CompileContext
 * @typedef {import('micromark-util-types').Handle} Handle
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {Parser} from 'acorn'
import acornJsx from 'acorn-jsx'
import {visit} from 'estree-util-visit'
import {micromark} from 'micromark'
import {mdxJsx} from 'micromark-extension-mdx-jsx'

const acorn = Parser.extend(acornJsx())

/** @type {HtmlExtension} */
const html = {
  enter: {mdxJsxTextTag: start, mdxJsxFlowTag: start},
  exit: {mdxJsxTextTag: end, mdxJsxFlowTag: end}
}

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function start() {
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {Handle}
 */
function end() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

test('core', async function () {
  assert.deepEqual(
    Object.keys(await import('micromark-extension-mdx-jsx')).sort(),
    ['mdxJsx'],
    'should expose the public api'
  )

  assert.throws(
    function () {
      // @ts-expect-error: runtime.
      mdxJsx({acorn: true})
    },
    /Expected a proper `acorn` instance passed in as `options\.acorn`/,
    'should crash on `acorn` w/o `parse`'
  )

  assert.throws(
    function () {
      // @ts-expect-error: runtime.
      mdxJsx({acornOptions: {}})
    },
    /Expected an `acorn` instance passed in as `options\.acorn`/,
    'should crash on `acornOptions` w/o `acorn`'
  )

  assert.throws(
    function () {
      mdxJsx({addResult: true})
    },
    /Expected an `acorn` instance passed in as `options\.acorn`/,
    'should crash on `addResult` w/o `acorn`'
  )

  assert.equal(
    micromark('a <b/> c.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c.</p>',
    'should support a self-closing element'
  )

  assert.equal(
    micromark('a <b></b> c.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  c.</p>',
    'should support a closed element'
  )

  assert.equal(
    micromark('a <></> c.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c.</p>',
    'should support fragments'
  )

  assert.equal(
    micromark('a <b>*b*</b> c.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a <em>b</em> c.</p>',
    'should support markdown inside elements'
  )
})

test('text (agnostic)', function () {
  assert.equal(
    micromark('a <b /> c', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c</p>',
    'should support a self-closing element'
  )

  assert.equal(
    micromark('a <b> c </b> d', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  c  d</p>',
    'should support a closed element'
  )

  assert.equal(
    micromark('a <b> c', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c</p>',
    'should support an unclosed element'
  )

  assert.equal(
    micromark('a <b {1 + 1} /> c', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  c</p>',
    'should support an attribute expression'
  )

  assert.equal(
    micromark('a <b c={1 + 1} /> d', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  d</p>',
    'should support an attribute value expression'
  )
})

test('text (gnostic)', function () {
  assert.equal(
    micromark('a <b /> c', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  c</p>',
    'should support a self-closing element'
  )

  assert.equal(
    micromark('a <b> c </b> d', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  c  d</p>',
    'should support a closed element'
  )

  assert.equal(
    micromark('a <b> c', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  c</p>',
    'should support an unclosed element'
  )

  assert.equal(
    micromark('a <b {...c} /> d', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  d</p>',
    'should support an attribute expression'
  )

  assert.equal(
    micromark('a <b {...{c: 1, d: Infinity, e: false}} /> f', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  f</p>',
    'should support more complex attribute expression (1)'
  )

  assert.equal(
    micromark('a <b {...[1, Infinity, false]} /> d', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  d</p>',
    'should support more complex attribute expression (2)'
  )

  assert.equal(
    micromark('a <b c={1 + 1} /> d', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  d</p>',
    'should support an attribute value expression'
  )

  assert.throws(
    function () {
      micromark('a <b c={} /> d', {extensions: [mdxJsx({acorn})]})
    },
    /Unexpected empty expression/,
    'should crash on an empty attribute value expression'
  )

  assert.throws(
    function () {
      micromark('a <b {1 + 1} /> c', {extensions: [mdxJsx({acorn})]})
    },
    /Could not parse expression with acorn: Unexpected token/,
    'should crash on a non-spread attribute expression'
  )

  assert.throws(
    function () {
      micromark('a <b c={?} /> d', {extensions: [mdxJsx({acorn})]})
    },
    /Could not parse expression with acorn: Unexpected token/,
    'should crash on invalid JS in an attribute value expression'
  )

  assert.throws(
    function () {
      micromark('a <b {?} /> c', {extensions: [mdxJsx({acorn})]})
    },
    /Could not parse expression with acorn: Unexpected token/,
    'should crash on invalid JS in an attribute expression'
  )

  assert.throws(
    function () {
      micromark('a <b{c=d}={}/> f', {extensions: [mdxJsx({acorn})]})
    },
    /Unexpected `ExpressionStatement` in code: expected an object spread/,
    'should crash on invalid JS in an attribute expression (2)'
  )

  assert.equal(
    micromark('a <b c={(2)} d={<e />} /> f', {
      extensions: [mdxJsx({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a  f</p>',
    'should support parenthesized expressions'
  )
})

test('text (complete)', function () {
  assert.equal(
    micromark('a <b> c', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c</p>',
    'should support an unclosed element'
  )

  assert.equal(
    micromark('a <> c', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c</p>',
    'should support an unclosed fragment'
  )

  assert.equal(
    micromark('a < \t>b</>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a &lt; \t&gt;b</p>',
    'should *not* support whitespace in the opening tag (fragment)'
  )

  assert.equal(
    micromark('a < \nb\t>b</b>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a &lt;\nb\t&gt;b</p>',
    'should *not* support whitespace in the opening tag (named)'
  )

  assert.throws(
    function () {
      micromark('a <!> b', {extensions: [mdxJsx()]})
    },
    /Unexpected character `!` \(U\+0021\) before name, expected a character that can start a name, such as a letter, `\$`, or `_`/,
    'should crash on a nonconforming start identifier'
  )

  assert.throws(
    function () {
      micromark('a <a></(> b.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\(` \(U\+0028\) before name, expected a character that can start a name, such as a letter, `\$`, or `_`/,
    'should crash on a nonconforming start identifier in a closing tag'
  )

  assert.equal(
    micromark('a <π /> b.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  b.</p>',
    'should support non-ascii identifier start characters'
  )

  assert.throws(
    function () {
      micromark('a <© /> b.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `©` \(U\+00A9\) before name, expected a character that can start a name, such as a letter, `\$`, or `_`/,
    'should crash on non-conforming non-ascii identifier start characters'
  )

  assert.throws(
    function () {
      micromark('a <!--b-->', {extensions: [mdxJsx()]})
    },
    /Unexpected character `!` \(U\+0021\) before name, expected a character that can start a name, such as a letter, `\$`, or `_` \(note: to create a comment in MDX, use `{\/\* text \*\/}`\)/,
    'should crash nicely on what might be a comment'
  )

  assert.throws(
    function () {
      micromark('a <// b\nc/>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\/` \(U\+002F\) before name, expected a character that can start a name, such as a letter, `\$`, or `_` \(note: JS comments in JSX tags are not supported in MDX\)/,
    'should crash nicely JS line comments inside tags (1)'
  )

  assert.throws(
    function () {
      micromark('a <b// c\nd/>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\/` \(U\+002F\) after self-closing slash, expected `>` to end the tag \(note: JS comments in JSX tags are not supported in MDX\)/,
    'should crash nicely JS line comments inside tags (2)'
  )

  assert.throws(
    function () {
      micromark('a </*b*/c>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\*` \(U\+002A\) before name, expected a character that can start a name, such as a letter, `\$`, or `_` \(note: JS comments in JSX tags are not supported in MDX\)/,
    'should crash nicely JS multiline comments inside tags (1)'
  )

  assert.throws(
    function () {
      micromark('a <b/*c*/>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\*` \(U\+002A\) after self-closing slash, expected `>` to end the tag \(note: JS comments in JSX tags are not supported in MDX\)/,
    'should crash nicely JS multiline comments inside tags (2)'
  )

  assert.equal(
    micromark('a <a\u200Cb /> b.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  b.</p>',
    'should support non-ascii identifier continuation characters'
  )

  assert.throws(
    function () {
      micromark('a <a¬ /> b.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `¬` \(U\+00AC\) in name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on non-conforming non-ascii identifier continuation characters'
  )

  assert.throws(
    function () {
      micromark('a <b@c.d>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `@` \(U\+0040\) in name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag \(note: to create a link in MDX, use `\[text]\(url\)`\)/,
    'should crash nicely on what might be an email link'
  )

  assert.equal(
    micromark('a <a-->b</a-->.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b.</p>',
    'should support dashes in names'
  )

  assert.throws(
    function () {
      micromark('a <a?> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\?` \(U\+003F\) in name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on nonconforming identifier continuation characters'
  )

  assert.equal(
    micromark('a <abc . def.ghi>b</abc.def . ghi>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b.</p>',
    'should support dots in names for method names'
  )

  assert.throws(
    function () {
      micromark('a <b.c@d.e>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `@` \(U\+0040\) in member name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag \(note: to create a link in MDX, use `\[text]\(url\)`\)/,
    'should crash nicely on what might be an email link in member names'
  )

  assert.equal(
    micromark('a <svg: rect>b</  svg :rect>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b.</p>',
    'should support colons in names for local names'
  )

  assert.throws(
    function () {
      micromark('a <a:+> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\+` \(U\+002B\) before local name, expected a character that can start a name, such as a letter, `\$`, or `_` \(note: to create a link in MDX, use `\[text]\(url\)`\)/,
    'should crash on a nonconforming character to start a local name'
  )

  assert.throws(
    function () {
      micromark('a <http://example.com>', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\/` \(U\+002F\) before local name, expected a character that can start a name, such as a letter, `\$`, or `_` \(note: to create a link in MDX, use `\[text]\(url\)`\)/,
    'should crash nicely on what might be a protocol in local names'
  )

  assert.throws(
    function () {
      micromark('a <http: >', {extensions: [mdxJsx()]})
    },
    /Unexpected character `>` \(U\+003E\) before local name, expected a character that can start a name, such as a letter, `\$`, or `_`/,
    'should crash nicely on what might be a protocol in local names'
  )

  assert.throws(
    function () {
      micromark('a <a:b|> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\|` \(U\+007C\) in local name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character in a local name'
  )

  assert.throws(
    function () {
      micromark('a <a..> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\.` \(U\+002E\) before member name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character to start a member name'
  )

  assert.throws(
    function () {
      micromark('a <a.b,> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `,` \(U\+002C\) in member name, expected a name character such as letters, digits, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character in a member name'
  )

  assert.throws(
    function () {
      micromark('a <a:b .> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\.` \(U\+002E\) after local name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character after a local name'
  )

  assert.throws(
    function () {
      micromark('a <a.b :> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `:` \(U\+003A\) after member name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character after a member name'
  )

  assert.throws(
    function () {
      micromark('a <a => c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `=` \(U\+003D\) after name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character after name'
  )

  assert.equal(
    micromark('a <b {...props} {...rest}>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support attribute expressions'
  )

  assert.equal(
    micromark('a <b {...{"a": "b"}}>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support nested balanced braces in attribute expressions'
  )

  assert.equal(
    micromark('<a{...b}/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>.</p>',
    'should support attribute expressions directly after a name'
  )

  assert.equal(
    micromark('<a.b{...c}/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>.</p>',
    'should support attribute expressions directly after a member name'
  )

  assert.equal(
    micromark('<a:b{...c}/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>.</p>',
    'should support attribute expressions directly after a local name'
  )

  assert.equal(
    micromark('a <b c{...d}/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a .</p>',
    'should support attribute expressions directly after boolean attributes'
  )

  assert.equal(
    micromark('a <b c:d{...e}/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a .</p>',
    'should support attribute expressions directly after boolean qualified attributes'
  )

  assert.equal(
    micromark('a <b a {...props} b>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support attribute expressions and normal attributes'
  )

  assert.equal(
    micromark('a <b c     d="d"\t\tefg=\'e\'>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support attributes'
  )

  assert.throws(
    function () {
      micromark('a <b {...p}~>c</b>.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `~` \(U\+007E\) before attribute name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character before an attribute name'
  )

  assert.throws(
    function () {
      micromark('a <b {...', {extensions: [mdxJsx()]})
    },
    /Unexpected end of file in expression, expected a corresponding closing brace for `{`/,
    'should crash on a missing closing brace in attribute expression'
  )

  assert.throws(
    function () {
      micromark('a <a b@> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `@` \(U\+0040\) in attribute name, expected an attribute name character such as letters, digits, `\$`, or `_`; `=` to initialize a value; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character in attribute name'
  )

  assert.equal(
    micromark('a <b xml :\tlang\n= "de-CH" foo:bar>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support prefixed attributes'
  )

  assert.equal(
    micromark('a <b a b : c d : e = "f" g/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a .</p>',
    'should support prefixed and normal attributes'
  )

  assert.throws(
    function () {
      micromark('a <a b 1> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `1` \(U\+0031\) after attribute name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; `=` to initialize a value; or the end of the tag/,
    'should crash on a nonconforming character after an attribute name'
  )

  assert.throws(
    function () {
      micromark('a <a b:#> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `#` \(U\+0023\) before local attribute name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`/,
    'should crash on a nonconforming character to start a local attribute name'
  )

  assert.throws(
    function () {
      micromark('a <a b:c%> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `%` \(U\+0025\) in local attribute name, expected an attribute name character such as letters, digits, `\$`, or `_`; `=` to initialize a value; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character in a local attribute name'
  )

  assert.throws(
    function () {
      micromark('a <a b:c ^> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\^` \(U\+005E\) after local attribute name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; `=` to initialize a value; or the end of the tag/,
    'should crash on a nonconforming character after a local attribute name'
  )

  assert.equal(
    micromark('a <b c={1 + 1}>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support attribute value expressions'
  )

  assert.equal(
    micromark('a <b c={1 + ({a: 1}).a}>c</b>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a c.</p>',
    'should support nested balanced braces in attribute value expressions'
  )

  assert.throws(
    function () {
      micromark('a <a b=``> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `` ` `` \(U\+0060\) before attribute value, expected a character that can start an attribute value, such as `"`, `'`, or `{`/,
    'should crash on a nonconforming character before an attribute value'
  )

  assert.throws(
    function () {
      micromark('a <a b=<c />> d.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `<` \(U\+003C\) before attribute value, expected a character that can start an attribute value, such as `"`, `'`, or `{` \(note: to use an element or fragment as a prop value in MDX, use `{<element \/>}`\)/,
    'should crash nicely on what might be a fragment, element as prop value'
  )

  assert.throws(
    function () {
      micromark('a <a b="> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected end of file in attribute value, expected a corresponding closing quote `"`/,
    'should crash on a missing closing quote in double quoted attribute value'
  )

  assert.throws(
    function () {
      micromark("a <a b='> c.", {extensions: [mdxJsx()]})
    },
    /Unexpected end of file in attribute value, expected a corresponding closing quote `'`/,
    'should crash on a missing closing quote in single quoted attribute value'
  )

  assert.throws(
    function () {
      micromark('a <a b={> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected end of file in expression, expected a corresponding closing brace for `{`/,
    'should crash on a missing closing brace in an attribute value expression'
  )

  assert.throws(
    function () {
      micromark('a <a b=""*> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `\*` \(U\+002A\) before attribute name, expected a character that can start an attribute name, such as a letter, `\$`, or `_`; whitespace before attributes; or the end of the tag/,
    'should crash on a nonconforming character after an attribute value'
  )

  assert.equal(
    micromark('<a b=""c/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>.</p>',
    'should support an attribute directly after a value'
  )

  assert.equal(
    micromark('<a{...b}c/>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>.</p>',
    'should support an attribute directly after an attribute expression'
  )

  assert.throws(
    function () {
      micromark('a <a/b> c.', {extensions: [mdxJsx()]})
    },
    /Unexpected character `b` \(U\+0062\) after self-closing slash, expected `>` to end the tag/,
    'should crash on a nonconforming character after a self-closing slash'
  )

  assert.equal(
    micromark('<a/ \t>.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>.</p>',
    'should support whitespace directly after closing slash'
  )

  assert.doesNotThrow(function () {
    micromark('a > c.', {extensions: [mdxJsx()], htmlExtensions: [html]})
  }, 'should *not* crash on closing angle in text')

  assert.doesNotThrow(function () {
    micromark('a <>`<`</> c.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    })
  }, 'should *not* crash on opening angle in tick code in an element')

  assert.doesNotThrow(function () {
    micromark('a <>`` ``` ``</>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    })
  }, 'should *not* crash on ticks in tick code in an element')

  assert.equal(
    micromark('a </> c.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a  c.</p>',
    'should support a closing tag w/o open elements'
  )

  assert.equal(
    micromark('a <></b>', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a </p>',
    'should support mismatched tags (1)'
  )
  assert.equal(
    micromark('a <b></>', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a </p>',
    'should support mismatched tags (2)'
  )
  assert.equal(
    micromark('a <a.b></a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (3)'
  )
  assert.equal(
    micromark('a <a></a.b>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (4)'
  )
  assert.equal(
    micromark('a <a.b></a.c>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (5)'
  )
  assert.equal(
    micromark('a <a:b></a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (6)'
  )
  assert.equal(
    micromark('a <a></a:b>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (7)'
  )
  assert.equal(
    micromark('a <a:b></a:c>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (8)'
  )
  assert.equal(
    micromark('a <a:b></a.b>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a </p>',
    'should support mismatched tags (9)'
  )

  assert.equal(
    micromark('a <a>b</a/>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b</p>',
    'should support a closing self-closing tag'
  )

  assert.equal(
    micromark('a <a>b</a b>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b</p>',
    'should support a closing tag w/ attributes'
  )

  assert.equal(
    micromark('a <>b <>c</> d</>.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a b c d.</p>',
    'should support nested tags'
  )

  assert.equal(
    micromark(
      '<x y="Character references can be used: &quot;, &apos;, &lt;, &gt;, &#x7B;, and &#x7D;, they can be named, decimal, or hexadecimal: &copy; &#8800; &#x1D306;" />.',
      {extensions: [mdxJsx()], htmlExtensions: [html]}
    ),
    '<p>.</p>',
    'should support character references in attribute values'
  )

  assert.equal(
    micromark(
      '<x>Character references can be used: &quot;, &apos;, &lt;, &gt;, &#x7B;, and &#x7D;, they can be named, decimal, or hexadecimal: &copy; &#8800; &#x1D306;</x>.',
      {extensions: [mdxJsx()], htmlExtensions: [html]}
    ),
    "<p>Character references can be used: &quot;, ', &lt;, &gt;, {, and }, they can be named, decimal, or hexadecimal: © ≠ 팆.</p>",
    'should support character references in text'
  )

  assert.equal(
    micromark('<x />.', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>.</p>',
    'should support as text if the closing tag is not the last thing'
  )

  assert.equal(
    micromark('a <x />', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>a </p>',
    'should support as text if the opening is not the first thing'
  )

  assert.equal(
    micromark('a *open <b> close* </b> c.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a <em>open  close</em>  c.</p>',
    'should not care about precedence between attention (emphasis)'
  )

  assert.equal(
    micromark('a **open <b> close** </b> c.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a <strong>open  close</strong>  c.</p>',
    'should not care about precedence between attention (strong)'
  )

  assert.equal(
    micromark('a [open <b> close](c) </b> d.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a <a href="c">open  close</a>  d.</p>',
    'should not care about precedence between label (link)'
  )

  assert.equal(
    micromark('a ![open <b> close](c) </b> d.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a <img src="c" alt="open  close" />  d.</p>',
    'should not care about precedence between label (image)'
  )

  assert.equal(
    micromark('> a <b>\n> c </b> d.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<blockquote>\n<p>a c  d.</p>\n</blockquote>',
    'should support line endings in elements'
  )

  assert.equal(
    micromark('> a <b c="d\ne" /> f', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<blockquote>\n<p>a  f</p>\n</blockquote>',
    'should support line endings in attribute values'
  )

  assert.equal(
    micromark('> a <b c={d\ne} /> f', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<blockquote>\n<p>a  f</p>\n</blockquote>',
    'should support line endings in attribute value expressions'
  )

  assert.equal(
    micromark('> a <b {c\nd} /> e', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<blockquote>\n<p>a  e</p>\n</blockquote>',
    'should support line endings in attribute expressions'
  )

  assert.equal(
    micromark('1 < 3', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '<p>1 &lt; 3</p>',
    'should allow `<` followed by markdown whitespace as text in markdown'
  )

  assert.equal(
    micromark('a <b \n c> d.', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>a  d.</p>',
    'should allow line endings in whitespace'
  )
})

test('flow (agnostic)', function () {
  assert.equal(
    micromark('<a />', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '',
    'should support a self-closing element'
  )

  assert.equal(
    micromark('<a></a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '',
    'should support a closed element'
  )

  assert.equal(
    micromark('<a>\nb\n</a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>b</p>\n',
    'should support an element w/ content'
  )

  assert.equal(
    micromark('<a>\n- b\n</a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<ul>\n<li>b</li>\n</ul>\n',
    'should support an element w/ containers as content'
  )

  assert.equal(
    micromark('<a b c:d e="" f={/* g */} {...h} />', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '',
    'should support attributes'
  )
})

// Flow is mostly the same as `text`, so we only test the relevant
// differences.
test('flow (essence)', function () {
  assert.equal(
    micromark('<a />', {extensions: [mdxJsx()], htmlExtensions: [html]}),
    '',
    'should support an element'
  )

  assert.equal(
    micromark('<a>\n- b\n</a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<ul>\n<li>b</li>\n</ul>\n',
    'should support an element around a container'
  )

  assert.equal(
    micromark('<x\n  y\n>  \nb\n  </x>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>b</p>\n',
    'should support a dangling `>` in a tag (not a block quote)'
  )

  assert.equal(
    micromark('<a>  \nb\n  </a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>b</p>\n',
    'should support trailing initial and final whitespace around tags'
  )

  assert.equal(
    micromark('<a> <b>\t\nc\n  </b> </a>', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<p>c</p>\n',
    'should support tags after tags'
  )

  assert.throws(
    function () {
      micromark('> <X\n/>', {extensions: [mdxJsx()]})
    },
    /Unexpected lazy line in container/,
    'should not support lazy flow (1)'
  )

  assert.throws(
    function () {
      micromark('> a\n> <X\n/>', {extensions: [mdxJsx()]})
    },
    /Unexpected lazy line in container/,
    'should not support lazy flow (2)'
  )

  assert.deepEqual(
    micromark('> a\n<X />', {
      extensions: [mdxJsx()],
      htmlExtensions: [html]
    }),
    '<blockquote>\n<p>a</p>\n</blockquote>\n',
    'should not support lazy flow (3)'
  )
})

test('should use correct positional info when tabs are used', function () {
  const example = '<a {...`\n\t`}/>'
  /** @type {Program | undefined} */
  let program

  const acornNode = /** @type {Node} */ (
    acorn.parseExpressionAt(example, 0, {
      ecmaVersion: 'latest',
      locations: true,
      ranges: true
    })
  )

  micromark(example, {
    extensions: [mdxJsx({acorn, addResult: true})],
    htmlExtensions: [{enter: {mdxJsxFlowTagExpressionAttribute: expression}}]
  })

  assert(acornNode.type === 'JSXElement')
  const acornAttribute = acornNode.openingElement.attributes[0]
  assert(acornAttribute.type === 'JSXSpreadAttribute')
  const acornArgument = acornAttribute.argument

  assert(program)
  removeOffsets(program)
  const micromarkStatement = program.body[0]
  assert(micromarkStatement.type === 'ExpressionStatement')
  const micromarkExpression = micromarkStatement.expression
  assert(micromarkExpression.type === 'ObjectExpression')
  const micromarkProperty = micromarkExpression.properties[0]
  assert(micromarkProperty.type === 'SpreadElement')
  const micromarkArgument = micromarkProperty.argument

  assert.deepEqual(
    JSON.parse(JSON.stringify(micromarkArgument)),
    JSON.parse(JSON.stringify(acornArgument))
  )

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function expression(token) {
    program = token.estree
  }
})

test('should use correct positional when there are virtual spaces due to a block quote', function () {
  /** @type {Program | undefined} */
  let program

  micromark('> <a b={`\n>\t`}/>', {
    extensions: [mdxJsx({acorn, addResult: true})],
    htmlExtensions: [
      {enter: {mdxJsxFlowTagAttributeValueExpression: expression}}
    ]
  })

  assert(program)
  removeOffsets(program)

  assert.deepEqual(
    JSON.parse(JSON.stringify(program)),
    JSON.parse(
      JSON.stringify({
        type: 'Program',
        start: 8,
        end: 13,
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'TemplateLiteral',
              start: 8,
              end: 13,
              loc: {start: {line: 1, column: 8}, end: {line: 2, column: 3}},
              expressions: [],
              quasis: [
                {
                  type: 'TemplateElement',
                  start: 9,
                  end: 12,
                  loc: {
                    start: {line: 1, column: 9},
                    end: {line: 2, column: 2}
                  },
                  value: {raw: '\n', cooked: '\n'},
                  tail: true,
                  range: [9, 12]
                }
              ],
              range: [8, 13]
            },
            start: 8,
            end: 13,
            loc: {start: {line: 1, column: 8}, end: {line: 2, column: 3}},
            range: [8, 13]
          }
        ],
        sourceType: 'module',
        comments: [],
        loc: {start: {line: 1, column: 8}, end: {line: 2, column: 3}},
        range: [8, 13]
      })
    )
  )

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function expression(token) {
    program = token.estree
  }
})

test('should keep the correct number of spaces in a blockquote', function () {
  /** @type {Program | undefined} */
  let program

  micromark('> <a b={`\n> alpha\n>  bravo\n>   charlie\n>    delta\n> `}/>', {
    extensions: [mdxJsx({acorn, addResult: true})],
    htmlExtensions: [
      {enter: {mdxJsxFlowTagAttributeValueExpression: expression}}
    ]
  })

  assert(program)
  removeOffsets(program)
  const statement = program.body[0]
  assert(statement.type === 'ExpressionStatement')
  assert(statement.expression.type === 'TemplateLiteral')
  const quasi = statement.expression.quasis[0]
  assert(quasi)
  const value = quasi.value.cooked
  assert.equal(value, '\nalpha\n bravo\n  charlie\n   delta\n')

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function expression(token) {
    program = token.estree
  }
})

/**
 * @param {Node} node
 * @returns {void}
 */
function removeOffsets(node) {
  visit(node, (d) => {
    assert(d.loc, 'expected `loc`')
    // @ts-expect-error: we add offsets, as we have them.
    delete d.loc.start.offset
    // @ts-expect-error: we add offsets.
    delete d.loc.end.offset
  })
}
