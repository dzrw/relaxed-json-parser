describe('Relaxed JSON Expression Parser', function() {
    
    it('should be able to parse simple object literals', function() {
        var result = rj.parse("a: 1, b: 2, \"quotedKey\": 3, 'aposQuotedKey': 4");
        expect(result.length).toBe(4);
        expect(result[0].key).toBe("a");
        expect(result[0].value).toBe(" 1");
        expect(result[1].key).toBe(" b");
        expect(result[1].value).toBe(" 2");  
        expect(result[2].key).toBe(" \"quotedKey\"");
        expect(result[2].value).toBe(" 3");   
        expect(result[3].key).toBe(" 'aposQuotedKey'");
        expect(result[3].value).toBe(" 4");                         
    });

    it('should ignore any outer braces', function() {
        var result = rj.parse("{a: 1}");
        expect(result.length).toBe(1);
        expect(result[0].key).toBe("a");
        expect(result[0].value).toBe(" 1");        
    });

    it('should be able to parse object literals containing string literals', function() {
        var result = rj.parse("a: \"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\", b: 'escapedApos\\\' brace} bracket] quot\"'");
        expect(result.length).toBe(2);
        expect(result[0].key).toBe("a");
        expect(result[0].value).toBe(" \"comma, colon: brace{ bracket[ apos' escapedQuot\\\" end\"");
        expect(result[1].key).toBe(" b");
        expect(result[1].value).toBe(" 'escapedApos\\\' brace} bracket] quot\"'");        
    });

    it('should be able to parse object literals containing child objects, arrays, function literals, and newlines', function() {
        var result = rj.parse(
            "myObject : { someChild: { }, someChildArray: [1,2,3], \"quotedChildProp\": 'string value' },\n"
          + "someFn: function(a, b, c) { var regex = /}/; var str='/})({'; return {}; },"
          + "myArray : [{}, function() { }, \"my'Str\", 'my\"Str']"
        );
        expect(result.length).toBe(3);
        expect(result[0].key).toBe("myObject ");
        expect(result[0].value).toBe(" { someChild: { }, someChildArray: [1,2,3], \"quotedChildProp\": 'string value' }");
        expect(result[1].key).toBe("\nsomeFn");
        expect(result[1].value).toBe(" function(a, b, c) { var regex = /}/; var str='/})({'; return {}; }");
        expect(result[2].key).toBe("myArray ");
        expect(result[2].value).toBe(" [{}, function() { }, \"my'Str\", 'my\"Str']");
    });

    it('should be able to cope with malformed syntax (things that aren\'t key-value pairs)', function() {
        var result = rj.parse("malformed1, 'mal:formed2', good:3, { malformed: 4 }");
        expect(result.length).toBe(4);
        expect(result[0].unknown).toBe("malformed1");
        expect(result[1].unknown).toBe(" 'mal:formed2'");
        expect(result[2].key).toBe(" good");
        expect(result[2].value).toBe("3");
        expect(result[3].unknown).toBe(" { malformed: 4 }");
    });

    it('should ensure all keys are wrapped in quotes', function() {
        var rewritten = rj.rewrite("a: 1, 'b': 2, \"c\": 3");
        expect(rewritten).toBe("'a': 1, 'b': 2, \"c\": 3");
    });

    it('should convert JSON values to property accessors', function () {
        var rewritten = rj.rewrite('a : 1, b : firstName, c : function() { return "returnValue"; }');

        var model = { firstName: "bob", lastName: "smith" };
        with (model) {
            var parsedRewritten = eval("({" + rewritten + "})");
            expect(parsedRewritten.a).toBe(1);
            expect(parsedRewritten.b).toBe("bob");
            expect(parsedRewritten.c()).toBe("returnValue");

            parsedRewritten._ko_property_writers.b("bob2");
            expect(model.firstName).toBe("bob2");
        }
    });

    it('should be able to eval rewritten literals that contain unquoted keywords as keys', function() {
        var rewritten = rj.rewrite("if: true");
        expect(rewritten).toBe("'if': true");
        var evaluated = eval("({" + rewritten + "})");
        expect(evaluated['if']).toBe(true);
    });
});