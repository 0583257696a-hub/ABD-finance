const fs = require('fs');
let c = fs.readFileSync('retirement_workspace.html', 'utf8');

c = c.replace(/\.manufacturer-logo\.has-logo \.manufacturer-logo-text \{\r?\n\s*display: none;\r?\n\s*\}/, 
`.manufacturer-logo.has-logo .manufacturer-logo-text {
    display: inline-block;
    margin-right: 8px;
  }`);

fs.writeFileSync('retirement_workspace.html', c);
