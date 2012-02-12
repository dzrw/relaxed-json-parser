**rj** parses a superset of JSON similar to the notation used in [Knockout](http://knockoutjs.com/) data-bind attributes.  [outback.js](https://github.com/politician/outback) uses **rj** to parse its data-bind attributes and to revive unobtrusive data bindings.

## tl;dr

```CoffeeScript
x = location: 'http://news.ycombinator.com'
y = rj.parse 'attr: { href: @location }', x
expect(y.attr.href).toBe(x.location)
```

## `parse`

The parse method accepts a text and an optional resolver, and produces a JavaScript object.

## `revive`

The revive method applys a resolver to a source object to produce a "revived" object.

```CoffeeScript
resolver = location: 'http://news.ycombinator.com'

parsedObj = rj.parse 'attr: { href: @location }'
revivedObj = rj.revive parsedObj, resolver

expect(revivedObj.attr.href).toBe(resolver.location)
```

## `rewrite`

The rewrite method accepts a text and applies a series a regular expression transformations to rewrite it as a valid JSON text.

## Regular Expressions?! Now you have two problems...

**rj** is based off Crockford's json2.js which uses the same technique.  You can see the still-beating heart of his work in the parse method. 

## What sorts of texts are supported?

### Any valid JSON text

```CoffeeScript
o = rj.parse '{ "book": { "title": "The Grapes of Wrath", author: "John Steinbeck" } }'
```

### Texts where a symbol literals appears in value positions

A symbol literal is a legal JavaScript identifier prefixed by an `@` character.

```CoffeeScript
o = rj.parse '{ "book": { "title": @title, "author": @author } }'
```

### Outer braces are optional

```CoffeeScript
o = rj.parse '"book": { "title": @title, "author": @author }'
```

### Quotes are optional for JavaScript identifiers in key positions

```CoffeeScript
o = rj.parse 'book: { title: @title, author: @author }'
```

License
---

    The MIT License

    Copyright (c) 2012 David Zarlengo 

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

