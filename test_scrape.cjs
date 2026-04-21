const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('menu.html', 'utf8');
const $ = cheerio.load(html);

$('.nav-tabs li a').each((i, el) => {
    console.log('Tab:', $(el).text().trim(), 'Link:', $(el).attr('href'));
});

console.log("=== Menu Content ===");
// Print all h3 and their next siblings to capture the menus accurately
$('h3').each((i, el) => {
    let title = $(el).text().trim();
    let menuText = $(el).next().text().replace(/\s+/g, ' ').trim();
    if(title) console.log(`[${title}] -> ${menuText}`);
});
