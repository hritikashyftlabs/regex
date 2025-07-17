function matchUnion(patterns, text, pos) {
    for (let pattern of patterns) {
        let result = parsePattern(pattern, text, pos);
        if (result !== -1) return result;
    }
    return -1;
}
function parsePattern(pattern, text, startPos = 0) {
    if (pattern.includes('|')) {
        const alternatives = pattern.split('|');
        return matchUnion(alternatives, text, startPos);
    }
    
    let patternPos = 0;
    let textPos = startPos;
    
    while (patternPos < pattern.length) {
        const char = pattern[patternPos];
        const nextChar = pattern[patternPos + 1];
        
        if (nextChar === '*') {
            textPos = matchStar(
                (t, p) => char === '.' ? matchDot(t, p) : 
                         char === '[' ? matchCharClass(getCharClass(pattern, patternPos), t, p) :
                         matchLiteral(char, t, p),
                text, textPos
            );
            patternPos += 2;
        } else if (nextChar === '+') {
            let newPos = matchPlus(
                (t, p) => char === '.' ? matchDot(t, p) : 
                         char === '[' ? matchCharClass(getCharClass(pattern, patternPos), t, p) :
                         matchLiteral(char, t, p),
                text, textPos
            );
            if (newPos === -1) return -1;
            textPos = newPos;
            if (char === '[') {
                const charClass = getCharClass(pattern, patternPos);
                patternPos += charClass.length;
            } else {
                patternPos += 2;
            }
        } else if (nextChar === '?') {
            textPos = matchQuestion(
                (t, p) => char === '.' ? matchDot(t, p) : 
                         char === '[' ? matchCharClass(getCharClass(pattern, patternPos), t, p) :
                         matchLiteral(char, t, p),
                text, textPos
            );
            patternPos += 2;
        } else if (char === '[') {
            // Handle character class [abc]
            const charClass = getCharClass(pattern, patternPos);
            textPos = matchCharClass(charClass, text, textPos);
            if (textPos === -1) return -1;
            patternPos += charClass.length;
        } else if (char === '.') {
            textPos = matchDot(text, textPos);
            if (textPos === -1) return -1;
            patternPos++;
        } else {
            textPos = matchLiteral(char, text, textPos);
            if (textPos === -1) return -1;
            patternPos++;
        }
    }
    
    return textPos;
}

function regexMatch(pattern, text) {
    for (let i = 0; i <= text.length; i++) {
        if (parsePattern(pattern, text, i) !== -1) {
            return true;
        }
    }
    return false;
}

function regexMatchWithAnchors(pattern, text) {
    if (pattern.startsWith('^') && pattern.endsWith('$')) {
        const innerPattern = pattern.slice(1, -1);
        return parsePattern(innerPattern, text, 0) === text.length;
    }
    return undefined;
}

function matchLiteral(char, text, pos) {
    if (pos >= text.length || text[pos] !== char) {
        return -1;
    }
    return pos + 1;
}

function matchDot(text, pos) {
    if (pos >= text.length) {
        return -1;
    }
    return pos + 1;
}

function matchStar(matchFn, text, pos) {
    let currentPos = pos;
    
    while (currentPos < text.length) {
        let newPos = matchFn(text, currentPos);
        if (newPos === -1) break;
        currentPos = newPos;
    }
    
    return currentPos;
}

function matchPlus(matchFn, text, pos) {
    let newPos = matchFn(text, pos);
    if (newPos === -1) return -1;
    
    return matchStar(matchFn, text, newPos);
}

function matchCharClass(charClass, text, pos) {
    if (pos >= text.length) return -1;
    
    const chars = charClass.slice(1, -1); // Remove [ ]
    if (chars.includes(text[pos])) {
        return pos + 1;
    }
    return -1;
}
function matchQuestion(matchFn, text, pos) {
    let newPos = matchFn(text, pos);
    if (newPos !== -1) return newPos;
    return pos;
}

function getCharClass(pattern, startPos) {
    let endPos = pattern.indexOf(']', startPos + 1);
    if (endPos === -1) endPos = pattern.length;
    return pattern.slice(startPos, endPos + 1);
}

function startRegexTester() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log(' REGEX PARSER TESTER ');
    console.log('Type "exit" to quit\n');
    
    function askForInput() {
        rl.question('Enter regex pattern: ', (pattern) => {
            if (pattern.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                return;
            }
            
            rl.question('Enter text to test: ', (text) => {
                const result = regexMatch(pattern, text);
                console.log(`\nResult: "${pattern}" ${result ? '✓ MATCHES' : '✗ NO MATCH'} "${text}"\n`);
                askForInput();
            });
        });
    }
    
    askForInput();
}
if (require.main === module) {
    startRegexTester();
}

module.exports = {
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
};

