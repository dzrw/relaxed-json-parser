/* rj.enUS.js v0.1.0 - a parser which recognizes a superset of JSON
   (c) David Zarlengo -- http://github.com/politician/relaxed-json-parser
   License: MIT (http://www.opensource.org/licenses/mit-license.php)
*/
/*
    http://www.JSON.org/json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html
*/
/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// AMD anonymous module enclosure.  Creates a rj global variable only if one
// does not exist and AMD is not supported.

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else if (!root.rj) {
    // Browser globals
    root.rj = factory();
  }
}(this, function() {

    'use strict';

    var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

    function stringTrim (string) {
        return (string || "").replace(stringTrimRegex, "");
    };

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    function hop(context, p) {
        return Object.prototype.hasOwnProperty.call(context, p);
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;

    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    
    function decodeUnicodeScriptToRange(patternOrRegExp, flags) {

// The decodeUnicodeScriptToRange function takes a regexp pattern written in
// a dialect thatsupports Unicode categories (\p) and translates it to the 
// dialect supported by JavaScript.

        var pattern;

        if (patternOrRegExp instanceof RegExp) {
            return patternOrRegExp;
        }

        pattern = patternOrRegExp;
        return new RegExp(pattern, flags);
    };

    var compactIdentifierNamePattern = (function () {

// Constructs a regular expression which evaluates JavaScript IdentifierNames
// restricted to the typical ASCII ranges.
        
        var identifierName = '((?:[$_a-zA-Z])(?:[$_a-zA-Z0-9])*)';

        return identifierName;
    })();

    var rewriteUnquotedKeysWhichAreLegalJavaScriptIdentifiers = (function() {
       
// This pattern attempts to find JavaScript IdentifierNames occupying
// JSONMember positions in JSONObjects.

        var pattern = '(({|,)(\\s*)('+compactIdentifierNamePattern+')(\\s*:))';

// The regular expression pattern built above is written in a dialect which
// is not supported by JavaScript.

        var re = decodeUnicodeScriptToRange(pattern, 'g');

        return function (text) {
            
// This function quotes unquoted keys in JSONObject (defined in ECMA-262
// 15.12.1.2).  The unquoted key must be a legal JavaScript IdentifierName.
            
            var result;
            return result = text.replace(re, function(str, $1, prefix, leadingWhiteSpace, identifer, $5, suffix) {
                return '' + prefix + leadingWhiteSpace + '"' + identifer + '"' + suffix;
            });
        };
    })();

    var rewriteSymbolLiteralsAsJSONObject = (function() {

// A symbol literal is the '@' character (a non-JSON character) followed by a
// JavaScript IdentifierName (defined in ECMA-262 7.6). A symbol literal may 
// only appear in positions where a JSONValue (defined in ECMA-262 15.12.1) 
// is allowed.

        var symbolLiteralStart = '([:,\\]]\\s*)',
            symbolLiteral = '(' + symbolLiteralStart + '@' + compactIdentifierNamePattern + ')';

// The regular expression pattern built above is written in a dialect which
// is not supported by JavaScript.

        var re = decodeUnicodeScriptToRange(symbolLiteral, 'g');
        
        return function (text) {

// The rewriteSymbolLiteralAsJSON function replaces symbol literals with a
// JSON-compatible representation.

            var result;
            return result = text.replace(re, function(str, $1, prefix, identifer) {
                return '' + prefix + '{ "__symbol_literal": "' + identifer + '" }';
            });
        };
    })();

    function rewriteMissingOuterBraces (text) {

// The rewriteMissingOuterBraces function wraps the text in curly braces only 
// if the text is not wrapped in curly braces or brackets already.  This 
// function does not check whether the text has balanced braces or brackets to
// begin with.

        if(/^([^{\[])|([^}\]])$/g.test(text)) {
            text = '{' + text + '}';
        }

        return text;
    }

    function escapeMisunderstoodUnicodeCharacters(text) {

// We replace certain Unicode characters with escape sequences. JavaScript
// handles many characters incorrectly, either silently deleting them, or
// treating them as line endings.

        text = String(text);
        cx.lastIndex = 0;
        if (cx.test(text)) {
            text = text.replace(cx, function (a) {
                return '\\u' +
                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }
        
        return text;        
    }

    function rewrite (text) {
        
// The rewrite method applies a series of rewrite operations to transform a
// potentially invalid JSON text into a valid JSON text.

        text = escapeMisunderstoodUnicodeCharacters(text);
        text = stringTrim(text);
        text = rewriteMissingOuterBraces(text);
        text = rewriteUnquotedKeysWhichAreLegalJavaScriptIdentifiers(text);
        text = rewriteSymbolLiteralsAsJSONObject(text);

        return text;
    }

    function revive (j, reviver) {

// The revive method is used to recursively walk a structure, passing
// each name/value pair to a reviver function for possible transformation.

        if (typeof reviver === 'object') {

// If the reviver is passed as an object, assume that the caller wants to
// do symbol literal resolution using that object.

            var symbols = reviver;

            var resolver = function() {
                var k, v, args;
                args = Array.prototype.slice.call(arguments);
                if (args.length >= 1) {
                    k = args[0];
                    return hop(symbols, k) && symbols[k];
                } 
            }

            reviver = function(k, value) {
                var replacement;
                if (value && hop(value, '__symbol_literal')) {
                    replacement = resolver(value['__symbol_literal']);
                    if (!!replacement) {
                        value = replacement;
                    }
                } 

                return value;
            };
        }

        function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
                for (k in value) {
                    if (hop(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    }
                }
            }
            return reviver.call(holder, key, value);
        }        

        return typeof reviver === 'function' ? walk({'': j}, '') : j;
    }

    function parse (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

        var j;

// Parsing happens in five stages. In the first stage, we apply a series of
// transforms to the text to transform it into a valid JSON text.

        text = rewrite(text);

// In the third stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the third stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

        if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the fourth stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

            j = eval('(' + text + ')');

// In the optional fifth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

            return revive(j, reviver);
        }

// If the text is not JSON parseable, then a SyntaxError is thrown.

        throw new SyntaxError('rj.parse: text could not be made JSON parseable');
    };

// Export the module.

    return {
        version: '0.1.0',
        rewrite: rewrite, 
        parse: parse,
        revive: revive
    };

}));