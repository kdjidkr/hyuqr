
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\djcom\\Desktop\\hyu-qrloader\\src\\App.jsx', 'utf8');

let braces = 0;
let parents = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') braces++;
  if (char === '}') braces--;
  if (char === '(') parents++;
  if (char === ')') parents--;
  if (char === '[') brackets++;
  if (char === ']') brackets--;
}

console.log(`Braces: ${braces}`);
console.log(`Parentheses: ${parents}`);
console.log(`Brackets: ${brackets}`);
