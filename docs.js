const fs = require('fs');
const toc = require('markdown-toc');

const PATH_README = './README.md';

let readme = fs.readFileSync(PATH_README).toString();

readme = toc.insert(readme);
readme = readme.replace(/\t/g, '    ');

fs.writeFileSync(PATH_README, readme);
