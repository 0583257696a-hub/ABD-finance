const fs = require('fs');
let c = fs.readFileSync('retirement_workspace.html', 'utf8');

c = c.replace(/\.manufacturer-logo svg \{\r?\n\s*display: none;\r?\n\s*\}/, 
`.manufacturer-logo svg {
    display: block;
    width: 36px;
    height: 28px;
  }`);

fs.writeFileSync('retirement_workspace.html', c);
