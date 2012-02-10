(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals
    root.rj = factory();
  }
}(this, function() {

    var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
    var restoreCapturedTokensRegex = /\@ko_token_(\d+)\@/g;
    var javaScriptAssignmentTarget = /^[\_$a-z][\_$a-z0-9]*(\[.*?\])*(\.[\_$a-z][\_$a-z0-9]*(\[.*?\])*)*$/i;
    var javaScriptReservedWords = ["true", "false"];

    function arrayIndexOf (array, item) {
        if (typeof Array.prototype.indexOf == "function")
            return Array.prototype.indexOf.call(array, item);
        for (var i = 0, j = array.length; i < j; i++)
            if (array[i] === item)
                return i;
        return -1;
    };
            
    function stringTrim (string) {
        return (string || "").replace(stringTrimRegex, "");
    };

    function restoreTokens(string, tokens) {
        var prevValue = null;
        while (string != prevValue) { // Keep restoring tokens until it no longer makes a difference (they may be nested)
            prevValue = string;
            string = string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
                return tokens[tokenIndex];
            });
        }
        return string;
    }

    function isWriteableValue(expression) {
        if (arrayIndexOf(javaScriptReservedWords, stringTrim(expression).toLowerCase()) >= 0)
            return false;
        return expression.match(javaScriptAssignmentTarget) !== null;
    }

    function ensureQuoted(key) {
        var trimmedKey = stringTrim(key);
        switch (trimmedKey.length && trimmedKey.charAt(0)) {
            case "'":
            case '"': 
                return key;
            default:
                return "'" + trimmedKey + "'";
        }
    }

    function parseObjectLiteral (objectLiteralString) {
        // A full tokeniser+lexer would add too much weight to this library, so here's a simple parser
        // that is sufficient just to split an object literal string into a set of top-level key-value pairs

        var str = stringTrim(objectLiteralString);
        if (str.length < 3)
            return [];
        if (str.charAt(0) === "{")// Ignore any braces surrounding the whole object literal
            str = str.substring(1, str.length - 1);

        // Pull out any string literals and regex literals
        var tokens = [];
        var tokenStart = null, tokenEndChar;
        for (var position = 0; position < str.length; position++) {
            var c = str.charAt(position);
            if (tokenStart === null) {
                switch (c) {
                    case '"':
                    case "'":
                    case "/":
                        tokenStart = position;
                        tokenEndChar = c;
                        break;
                }
            } else if ((c == tokenEndChar) && (str.charAt(position - 1) !== "\\")) {
                var token = str.substring(tokenStart, position + 1);
                tokens.push(token);
                var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                position -= (token.length - replacement.length);
                tokenStart = null;
            }
        }

        // Next pull out balanced paren, brace, and bracket blocks
        tokenStart = null;
        tokenEndChar = null;
        var tokenDepth = 0, tokenStartChar = null;
        for (var position = 0; position < str.length; position++) {
            var c = str.charAt(position);
            if (tokenStart === null) {
                switch (c) {
                    case "{": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = "}";
                              break;
                    case "(": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = ")";
                              break;
                    case "[": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = "]";
                              break;
                }
            }

            if (c === tokenStartChar)
                tokenDepth++;
            else if (c === tokenEndChar) {
                tokenDepth--;
                if (tokenDepth === 0) {
                    var token = str.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                    str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;                            
                }
            }
        }

        // Now we can safely split on commas to get the key/value pairs
        var result = [];
        var keyValuePairs = str.split(",");
        for (var i = 0, j = keyValuePairs.length; i < j; i++) {
            var pair = keyValuePairs[i];
            var colonPos = pair.indexOf(":");
            if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                var key = pair.substring(0, colonPos);
                var value = pair.substring(colonPos + 1);
                result.push({ 'key': restoreTokens(key, tokens), 'value': restoreTokens(value, tokens) });
            } else {
                result.push({ 'unknown': restoreTokens(pair, tokens) });
            }
        }
        return result;            
    }

    function insertPropertyAccessorsIntoJson (objectLiteralStringOrKeyValueArray) {
        var keyValueArray = typeof objectLiteralStringOrKeyValueArray === "string" 
            ? parseObjectLiteral(objectLiteralStringOrKeyValueArray)
            : objectLiteralStringOrKeyValueArray;
        var resultStrings = [], propertyAccessorResultStrings = [];

        var keyValueEntry;
        for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
            if (resultStrings.length > 0)
                resultStrings.push(",");

            if (keyValueEntry['key']) {
                var quotedKey = ensureQuoted(keyValueEntry['key']), val = keyValueEntry['value'];
                resultStrings.push(quotedKey);
                resultStrings.push(":");              
                resultStrings.push(val);

                if (isWriteableValue(stringTrim(val))) {
                    if (propertyAccessorResultStrings.length > 0)
                        propertyAccessorResultStrings.push(", ");
                    propertyAccessorResultStrings.push(quotedKey + " : function(__ko_value) { " + val + " = __ko_value; }");
                }                    
            } else if (keyValueEntry['unknown']) {
                resultStrings.push(keyValueEntry['unknown']);
            }
        }

        var combinedResult = resultStrings.join("");
        if (propertyAccessorResultStrings.length > 0) {
            var allPropertyAccessors = propertyAccessorResultStrings.join("");
            combinedResult = combinedResult + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";                
        }

        return combinedResult;
    }

    function keyValueArrayContainsKey (keyValueArray, key) {
        for (var i = 0; i < keyValueArray.length; i++)
            if (stringTrim(keyValueArray[i]['key']) == key)
                return true;            
        return false;
    }

    return {
        'parse': parseObjectLiteral,
        'rewrite': insertPropertyAccessorsIntoJson
    };
}));
