const fs = require('fs');
let code = fs.readFileSync('retirement_workspace.html', 'utf8');

// Revert: XML parser accountNumber - back to const
code = code.replace(
  'let accountNumber = getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON"]) || getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON-NEGDI"]);\n      if (accountNumber) accountNumber = accountNumber.trim().replace(/^0+(?=\\d)/, "");',
  'const accountNumber = getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON"]) || getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON-NEGDI"]);'
);

// Revert: Excel parser accountNumber - back to original
code = code.replace(
  'accountNumber: account.replace(/^0+(?=\\d)/, "") || `\u05d7\u05e9\u05d1\u05d5\u05df-${fallbackIndex}`',
  'accountNumber: account || `\u05d7\u05e9\u05d1\u05d5\u05df-${fallbackIndex}`'
);

// Revert: normalizeAccount - back to original one-liner
code = code.replace(
  'let str = String(value || "").replace(/[^\\dA-Za-z]/g, "").trim();\n    return str.replace(/^0+(?=\\d)/, "");',
  'return String(value || "").replace(/[^\\dA-Za-z]/g, "").trim();'
);

fs.writeFileSync('retirement_workspace.html', code);

// Validate
const start = code.indexOf('<script>') + 8;
const end = code.lastIndexOf('</script>');
const script = code.slice(start, end);
try {
  new Function(script);
  console.log('JS VALID - system should work!');
} catch(e) {
  console.log('Still has error:', e.message);
}
