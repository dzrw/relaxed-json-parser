describe('the rj parser', function() {
    
    describe('recognizes a superset of JSON', function() {
        
        it('should be able to parse JSON', function() {
            var text = '{ "a": 1, "b": "two", "c": [ 3, 4 ], "d": { "five": 6 } }';
            var actual = rj.parse(text);

            expect(actual).toBeDefined();
            expect(actual.a).toBe(1);
            expect(actual.b).toBe('two');
            expect(actual.c).toContain(3);
            expect(actual.c).toContain(4);
            expect(actual.d).toBeDefined();
            expect(actual.d.five).toBe(6);
        });

        it('should be able to parse JSON containing symbol literals', function() {
            var text = '{ "html": @firstName }';
            var actual = rj.parse(text);

            expect(actual).toBeDefined();
            expect(actual.html).toBeDefined();
            expect(actual.html.__symbol_literal).toBe('firstName');
        });

        it('should be able to deal with missing outer braces', function() {
            var text = '"a": 1, "b": 2';
            
            var actual = rj.parse(text);
            
            expect(actual).toBeDefined();
            expect(actual.a).toBe(1);
            expect(actual.b).toBe(2);
        });

        it('should be able to deal with unquoted keys which are valid JavaScript identifiers', function() {
            var text = '{ checked: true }';
            
            var actual = rj.parse(text);
            
            expect(actual).toBeDefined();
            expect(actual.checked).toBeTruthy();
        });

        it('should be able to deal with unquoted keys which are JavaScript reserved words', function() {
            var text = '{ class: "boss" }';
            
            var actual = rj.parse(text);
            
            expect(actual).toBeDefined();
            expect(actual['class']).toBe('boss');
        });

        it('should be able to deal with unquoted keys in a complex object', function() {
            var text = 'class: { a: 1 }';
            
            var actual = rj.parse(text);
            
            expect(actual).toBeDefined();
            expect(actual['class'].a).toBe(1);
        });

    });

    describe('resolves symbol literals using a symbol table', function() {
        
        it('should call the reviver callback, if specified', function() {
            var text = '{ "html": @firstName }';
            var model = { firstName: 'bob' };

            var actual = rj.parse(text, model);
            
            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
        });

        it('should be able to parse and revive a simple object', function() {
            var text = '{ "html": @firstName, "color": @color }';
            var model = { firstName: 'bob', color: 'red' };

            var actual = rj.parse(text, model);
            
            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
            expect(actual.color).toBe('red');
        });

        it('should be able to parse and revive a nested object', function() {
            var text = '{ "html": @firstName, "css": { "color": @color } }';
            var model = { firstName: 'bob', color: 'red' };

            var actual = rj.parse(text, model);
            
            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
            expect(actual.css).toBeDefined();
            expect(actual.css.color).toBe('red');
        });

        it('should be able to parse and revive a complex object', function() {
            var text = '{ "html": @firstName, "css": { "color": @color, "float": @float }, "attr": { "class": @className } }';
            var model = { firstName: 'bob', color: 'red', float: 'none', className: 'ui-label' };

            var actual = rj.parse(text, model);
            
            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
            expect(actual.css.color).toBe('red');
            expect(actual.css.float).toBe('none');
            expect(actual.attr['class']).toBe('ui-label');
        });

    });

    describe("tortures Crockford's json2.js until it parses knockout.js data-bind attributes", function() {
        
        it('should be able to handle this abomination', function() {
            var text = 'html: @firstName, css: { color: @color, float: @float }, attr: { class: @className }';
            var model = { firstName: 'bob', color: 'red', float: 'none', className: 'ui-label' };

            var actual = rj.parse(text, model);

            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
            expect(actual.css.color).toBe('red');
            expect(actual.css.float).toBe('none');
            expect(actual.attr['class']).toBe('ui-label');
        });

        it('should not support JavaScript expressions because we have standards', function() {
            var text = 'visible: firstName().length > 0';

            expect(rj.parse, text).toThrow('rj.parse: text could not be made JSON parseable');
        });

    });

    describe("exposes a composable api", function() {
       
       it('should be possible to combine the rewriter and reviver with custom JSON parsing implementations', function() {
            var text = '{ "html": @firstName, "color": @color }';
            var model = { firstName: 'bob', color: 'red' };

            var rewritten = rj.rewrite(text);
            var parsed = JSON.parse(rewritten);
            var actual = rj.revive(parsed, model);

            expect(actual).toBeDefined();
            expect(actual.html).toBe('bob');
            expect(actual.color).toBe('red');
       })
        
    });

    describe("the examples in the readme work", function () {

        it('should replace cats with dogs', function() {
            var text = 'cats: "are the best!"';

            var actual = rj.parse(text, function (k, value) {
                if (value && value.hasOwnProperty('cats')) {
                    value.dogs = value.cats;
                    delete value.cats;
                }

                return value;
            });

            expect(actual.dogs).toBeDefined();
        });
        
    });

});