const menuText = '[천원의아침밥] "스팸야채볶음밥 Spam Vegetable Fried Rice" 미역장국 그린샐러드*드레싱 배추김치 우리쌀프레이크시리얼*저지방우유 1,000원';

const processed = menuText
  .replace(/"/g, '') // Remove double quotes
  .split(/\s+/) // Split by spaces
  .filter(item => !/[a-zA-Z]/.test(item)) // Remove items with English characters
  .filter(item => item.trim().length > 0) // Remove empty strings
  .join('\n'); // Join with newlines

console.log('Original:');
console.log(menuText);
console.log('\nProcessed:');
console.log(processed);
