const fs = require('fs');

let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(/[^\x00-\x7F]+/g, '&mdash;'); 
fs.writeFileSync('index.html', c, 'utf8');

let c2 = fs.readFileSync('casestudies/index.html', 'utf8');
c2 = c2.replace(/[^\x00-\x7F]+/g, '&mdash;'); 
fs.writeFileSync('casestudies/index.html', c2, 'utf8');
