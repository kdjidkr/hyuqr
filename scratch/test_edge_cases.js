const testCases = [
  '[천원의아침밥] "스팸야채볶음밥 Spam Vegetable Fried Rice" 미역장국',
  '돈까스(Pork Cutlet) 샐러드',
  'Beef Curry 소고기카레',
  '김치(Kimchi)'
];

testCases.forEach(menuText => {
  const processed = menuText
    .replace(/"/g, '')
    .split(/\s+/)
    .filter(item => !/[a-zA-Z]/.test(item))
    .filter(item => item.trim().length > 0)
    .join('\n');
  
  console.log(`Input: ${menuText}`);
  console.log(`Output:\n${processed}\n---`);
});
