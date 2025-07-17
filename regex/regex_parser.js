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
        if (textPos > text.length) return -1;
        
        const char = pattern[patternPos];
        const nextChar = patternPos + 1 < pattern.length ? pattern[patternPos + 1] : null;
        
        if (nextChar === '*') {
            if (char === '[') {
                const charClass = getCharClass(pattern, patternPos);
                const matchFn = (t, p) => matchCharClass(charClass, t, p);
                textPos = matchStar(matchFn, text, textPos);
                patternPos += charClass.length + 1;
            } else {
                const matchFn = char === '.' ? 
                    (t, p) => matchDot(t, p) : 
                    (t, p) => matchLiteral(char, t, p);
                textPos = matchStar(matchFn, text, textPos);
                patternPos += 2;
            }
        } else if (nextChar === '+') {
            if (char === '[') {
                const charClass = getCharClass(pattern, patternPos);
                const matchFn = (t, p) => matchCharClass(charClass, t, p);
                const newPos = matchPlus(matchFn, text, textPos);
                if (newPos === -1) return -1;
                textPos = newPos;
                patternPos += charClass.length + 1;
            } else {
                const matchFn = char === '.' ? 
                    (t, p) => matchDot(t, p) : 
                    (t, p) => matchLiteral(char, t, p);
                const newPos = matchPlus(matchFn, text, textPos);
                if (newPos === -1) return -1;
                textPos = newPos;
                patternPos += 2;
            }
        } else if (nextChar === '?') {
            if (char === '[') {
                const charClass = getCharClass(pattern, patternPos);
                const matchFn = (t, p) => matchCharClass(charClass, t, p);
                textPos = matchQuestion(matchFn, text, textPos);
                patternPos += charClass.length + 1;
            } else {
                const matchFn = char === '.' ? 
                    (t, p) => matchDot(t, p) : 
                    (t, p) => matchLiteral(char, t, p);
                textPos = matchQuestion(matchFn, text, textPos);
                patternPos += 2;
            }
        } else if (char === '[') {
            const charClass = getCharClass(pattern, patternPos);
            const newPos = matchCharClass(charClass, text, textPos);
            if (newPos === -1) return -1;
            textPos = newPos;
            patternPos += charClass.length;
        } else if (char === '.') {
            const newPos = matchDot(text, textPos);
            if (newPos === -1) return -1;
            textPos = newPos;
            patternPos++;
        } else {
            const newPos = matchLiteral(char, text, textPos);
            if (newPos === -1) return -1;
            textPos = newPos;
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
    } else if (pattern.startsWith('^')) {
        const innerPattern = pattern.slice(1);
        const result = parsePattern(innerPattern, text, 0);
        return result !== -1;
    } else if (pattern.endsWith('$')) {
        const innerPattern = pattern.slice(0, -1);
        for (let i = 0; i <= text.length; i++) {
            const result = parsePattern(innerPattern, text, i);
            if (result === text.length) return true;
        }
        return false;
    }
    return regexMatch(pattern, text);
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
    
    const chars = charClass.slice(1, -1);
    
    if (chars.includes('-') && chars.length > 2) {
        for (let i = 0; i < chars.length - 2; i++) {
            if (chars[i+1] === '-') {
                const start = chars[i].charCodeAt(0);
                const end = chars[i+2].charCodeAt(0);
                const current = text[pos].charCodeAt(0);
                if (current >= start && current <= end) {
                    return pos + 1;
                }
            }
        }
    }
    
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
                const result = regexMatchWithAnchors(pattern, text);
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

