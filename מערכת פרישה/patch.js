const fs = require('fs');
let c = fs.readFileSync('retirement_workspace.html', 'utf8');

c = c.replace(/\{ id: "accountNumber", label: "מס' פוליסה\/חשבון", width: 138 \}/g, 
`{ id: "accountNumber", label: "מס' פוליסה/חשבון", width: 156 }`);

c = c.replace(/\{ id: "accountNumber", label: "מס' פוליסה", width: 126 \}/g, 
`{ id: "accountNumber", label: "מס' פוליסה", width: 140 }`);

c = c.replace(/function normalizeAccount\(value\) \{[\s\S]*?\}/, 
`function normalizeAccount(value) {
    let str = String(value || "").replace(/[^\\dA-Za-z]/g, "").trim();
    return str.replace(/^0+(?=\\d)/, "");
  }`);

c = c.replace(/const accountNumber = getXmlText\(policyNode, \["MISPAR-POLISA-O-HESHBON"\]\) \|\| getXmlText\(policyNode, \["MISPAR-POLISA-O-HESHBON-NEGDI"\]\);/, 
`let accountNumber = getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON"]) || getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON-NEGDI"]);
      if (accountNumber) accountNumber = accountNumber.trim().replace(/^0+(?=\\d)/, "");`);

c = c.replace(/accountNumber: account \|\| `חשבון-\$\{fallbackIndex\}`/, 
`accountNumber: account.replace(/^0+(?=\\d)/, "") || \`חשבון-\${fallbackIndex}\``);

fs.writeFileSync('retirement_workspace.html', c);
console.log('Patched correctly');
