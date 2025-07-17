const {
    matchLiteral,
    matchDot,
    matchStar,
    matchPlus,
    matchQuestion,
    matchCharClass,
    matchUnion,
    parsePattern,
    regexMatch,
    regexMatchWithAnchors,
    getCharClass
} = require('./regex_parser');

describe('Regex Parser Functions', () => {
    
    describe('matchLiteral', () => {
        test('should match exact character at position', () => {
            expect(matchLiteral('a', 'apple', 0)).toBe(1);
            expect(matchLiteral('p', 'apple', 1)).toBe(2);
            expect(matchLiteral('e', 'apple', 4)).toBe(5);
        });
        
        test('should return -1 for no match', () => {
            expect(matchLiteral('x', 'apple', 0)).toBe(-1);
            expect(matchLiteral('a', 'apple', 1)).toBe(-1);
            expect(matchLiteral('a', '', 0)).toBe(-1);
        });
        
        test('should handle position beyond text length', () => {
            expect(matchLiteral('a', 'hi', 5)).toBe(-1);
        });
    });

    describe('matchDot', () => {
        test('should match any single character', () => {
            expect(matchDot('hello', 0)).toBe(1);
            expect(matchDot('123', 1)).toBe(2);
            expect(matchDot('a!@#', 2)).toBe(3);
            expect(matchDot(' \t\n', 0)).toBe(1);
        });
        
        test('should return -1 for empty text or beyond length', () => {
            expect(matchDot('', 0)).toBe(-1);
            expect(matchDot('hi', 2)).toBe(-1);
            expect(matchDot('a', 1)).toBe(-1);
        });
    });

    describe('matchStar', () => {
        const literalA = (t, p) => matchLiteral('a', t, p);
        const dotMatcher = (t, p) => matchDot(t, p);
        
        test('should match zero or more occurrences', () => {
            expect(matchStar(literalA, 'aaab', 0)).toBe(3);
            expect(matchStar(literalA, 'bbbb', 0)).toBe(0);
            expect(matchStar(literalA, '', 0)).toBe(0);
            expect(matchStar(literalA, 'a', 0)).toBe(1);
        });
        
        test('should work with dot matcher', () => {
            expect(matchStar(dotMatcher, 'hello', 0)).toBe(5);
            expect(matchStar(dotMatcher, '', 0)).toBe(0);
        });
        
        test('should stop at non-matching character', () => {
            expect(matchStar(literalA, 'aaabbb', 0)).toBe(3);
            expect(matchStar(literalA, 'baaaa', 0)).toBe(0);
        });
    });

    describe('matchPlus', () => {
        const literalA = (t, p) => matchLiteral('a', t, p);
        const dotMatcher = (t, p) => matchDot(t, p);
        
        test('should match one or more occurrences', () => {
            expect(matchPlus(literalA, 'aaab', 0)).toBe(3);
            expect(matchPlus(literalA, 'a', 0)).toBe(1);
            expect(matchPlus(literalA, 'aaa', 0)).toBe(3);
        });
        
        test('should return -1 for zero matches', () => {
            expect(matchPlus(literalA, 'bbbb', 0)).toBe(-1);
            expect(matchPlus(literalA, '', 0)).toBe(-1);
            expect(matchPlus(literalA, 'baaaa', 0)).toBe(-1);
        });
        
        test('should work with dot matcher', () => {
            expect(matchPlus(dotMatcher, 'hello', 0)).toBe(5);
            expect(matchPlus(dotMatcher, '', 0)).toBe(-1);
        });
    });

    describe('matchQuestion', () => {
        const literalA = (t, p) => matchLiteral('a', t, p);
        const dotMatcher = (t, p) => matchDot(t, p);
        
        test('should match zero or one occurrence', () => {
            expect(matchQuestion(literalA, 'apple', 0)).toBe(1);
            expect(matchQuestion(literalA, 'banana', 0)).toBe(0);
            expect(matchQuestion(literalA, 'a', 0)).toBe(1);
            expect(matchQuestion(literalA, '', 0)).toBe(0);
        });
        
        test('should match at most one occurrence', () => {
            expect(matchQuestion(literalA, 'aaaa', 0)).toBe(1);
            expect(matchQuestion(literalA, 'xyz', 0)).toBe(0);
        });
        
        test('should work with dot matcher', () => {
            expect(matchQuestion(dotMatcher, 'hello', 0)).toBe(1);
            expect(matchQuestion(dotMatcher, '', 0)).toBe(0);
        });
    });

    describe('matchCharClass', () => {
        test('should match characters in class', () => {
            expect(matchCharClass('[abc]', 'apple', 0)).toBe(1);
            expect(matchCharClass('[abc]', 'banana', 0)).toBe(1);
            expect(matchCharClass('[abc]', 'cat', 0)).toBe(1);
            expect(matchCharClass('[123]', '2nd', 0)).toBe(1);
        });
        
        test('should return -1 for characters not in class', () => {
            expect(matchCharClass('[abc]', 'dog', 0)).toBe(-1);
            expect(matchCharClass('[abc]', 'xyz', 0)).toBe(-1);
            expect(matchCharClass('[123]', 'abc', 0)).toBe(-1);
        });
        
        test('should handle position beyond text length', () => {
            expect(matchCharClass('[abc]', '', 0)).toBe(-1);
            expect(matchCharClass('[abc]', 'hi', 5)).toBe(-1);
        });
        
        test('should work at different positions', () => {
            expect(matchCharClass('[abc]', 'xbz', 1)).toBe(2); 
            expect(matchCharClass('[abc]', 'xyz', 1)).toBe(-1);
        });
    });

    describe('getCharClass', () => {
        test('should extract character class correctly', () => {
            expect(getCharClass('[abc]', 0)).toBe('[abc]');
            expect(getCharClass('x[abc]y', 1)).toBe('[abc]');
            expect(getCharClass('[123]def', 0)).toBe('[123]');
        });
        
        test('should handle missing closing bracket', () => {
            expect(getCharClass('[abc', 0)).toBe('[abc');
            expect(getCharClass('[', 0)).toBe('[');
        });
        
        test('should work with nested patterns', () => {
            expect(getCharClass('a[xyz]b[123]', 1)).toBe('[xyz]');
            expect(getCharClass('a[xyz]b[123]', 7)).toBe('[123]');
        });
    });

    describe('matchUnion', () => {
        test('should match first alternative', () => {
            expect(matchUnion(['cat', 'dog'], 'cat', 0)).toBe(3);
            expect(matchUnion(['a', 'b', 'c'], 'apple', 0)).toBe(1);
        });
        
        test('should match any alternative', () => {
            expect(matchUnion(['cat', 'dog'], 'dog', 0)).toBe(3);
            expect(matchUnion(['x', 'y', 'z'], 'zebra', 0)).toBe(1);
        });
        
        test('should return -1 when no alternatives match', () => {
            expect(matchUnion(['cat', 'dog'], 'bird', 0)).toBe(-1);
            expect(matchUnion(['a', 'b'], 'xyz', 0)).toBe(-1);
        });
        
        test('should work at different positions', () => {
            expect(matchUnion(['a', 'b'], 'banana', 1)).toBe(2);
            expect(matchUnion(['x', 'y'], 'banana', 1)).toBe(-1);
        });
    });

    describe('parsePattern', () => {
        test('should parse simple literals', () => {
            expect(parsePattern('abc', 'abc', 0)).toBe(3);
            expect(parsePattern('hello', 'hello', 0)).toBe(5);
            expect(parsePattern('x', 'xyz', 0)).toBe(1);
        });
        
        test('should handle dot wildcard', () => {
            expect(parsePattern('a.c', 'abc', 0)).toBe(3);
            expect(parsePattern('a.c', 'axc', 0)).toBe(3);
            expect(parsePattern('...', 'xyz', 0)).toBe(3);
        });
        
        test('should handle star quantifier', () => {
            expect(parsePattern('a*', 'aaa', 0)).toBe(3);
            expect(parsePattern('a*', 'bbb', 0)).toBe(0);
            expect(parsePattern('a*b', 'aaab', 0)).toBe(4);
        });
        
        test('should handle plus quantifier', () => {
            expect(parsePattern('a+', 'aaa', 0)).toBe(3);
            expect(parsePattern('a+', 'bbb', 0)).toBe(-1);
            expect(parsePattern('a+b', 'aaab', 0)).toBe(4);
        });
        
        test('should handle question quantifier', () => {
            expect(parsePattern('a?', 'a', 0)).toBe(1);
            expect(parsePattern('a?', 'b', 0)).toBe(0);
            expect(parsePattern('a?b', 'ab', 0)).toBe(2);
            expect(parsePattern('a?b', 'b', 0)).toBe(1);
        });
        
        test('should handle character classes', () => {
            expect(parsePattern('[abc]', 'a', 0)).toBe(1);
            expect(parsePattern('[abc]', 'b', 0)).toBe(1);
            expect(parsePattern('[abc]', 'x', 0)).toBe(-1);
        });
        
        test('should handle union operator', () => {
            expect(parsePattern('cat|dog', 'cat', 0)).toBe(3);
            expect(parsePattern('cat|dog', 'dog', 0)).toBe(3);
            expect(parsePattern('a|b|c', 'b', 0)).toBe(1);
        });
        
        test('should return -1 for no match', () => {
            expect(parsePattern('abc', 'xyz', 0)).toBe(-1);
            expect(parsePattern('a+', '', 0)).toBe(-1);
            expect(parsePattern('[abc]', 'xyz', 0)).toBe(-1);
        });
    });

    describe('regexMatch', () => {
        test('should find pattern anywhere in text', () => {
            expect(regexMatch('cat', 'the cat runs')).toBe(true);
            expect(regexMatch('run', 'the cat runs')).toBe(true);
            expect(regexMatch('the', 'the cat runs')).toBe(true);
        });
        
        test('should return false when pattern not found', () => {
            expect(regexMatch('dog', 'the cat runs')).toBe(false);
            expect(regexMatch('xyz', 'hello world')).toBe(false);
        });
        
        test('should work with quantifiers', () => {
            expect(regexMatch('a+', 'banana')).toBe(true);
            expect(regexMatch('x+', 'banana')).toBe(false);
            expect(regexMatch('a*', 'banana')).toBe(true);
        });
        
        test('should work with character classes', () => {
            expect(regexMatch('[abc]', 'xyz abc')).toBe(true);
            expect(regexMatch('[xyz]', 'abc def')).toBe(false);
        });
        
        test('should work with union', () => {
            expect(regexMatch('cat|dog', 'I have a cat')).toBe(true);
            expect(regexMatch('cat|dog', 'I have a dog')).toBe(true);
            expect(regexMatch('cat|dog', 'I have a bird')).toBe(false);
        });
    });

    describe('regexMatchWithAnchors', () => {
        test('should handle start and end anchors', () => {
            expect(regexMatchWithAnchors('^hello$', 'hello')).toBe(true);
            expect(regexMatchWithAnchors('^hello$', 'hello world')).toBe(false);
            expect(regexMatchWithAnchors('^hello$', 'say hello')).toBe(false);
        });
        
        test('should handle partial anchor implementation', () => {
            expect(regexMatchWithAnchors('^hello', 'hello world')).toBe(undefined);
            expect(regexMatchWithAnchors('world$', 'hello world')).toBe(undefined);
        });
    });
});
