const fs = require('fs');
let c = fs.readFileSync('retirement_workspace.html', 'utf8');

c = c.replace(/\{ id: "investmentTrack", label: "מסלול השקעה", width: 162 \},\r?\n\s*\{ id: "managementFees", label: "דמי ניהול", width: 138 \},\r?\n\s*\{ id: "maamad", label: "מעמד", width: 80 \}/, 
`{ id: "maamad", label: "מעמד", width: 80 },\n      { id: "investmentTrack", label: "מסלול השקעה", width: 162 },\n      { id: "managementFees", label: "דמי ניהול", width: 138 }`);

c = c.replace(/investmentTrack: escapeHtml\(getInfrastructureYieldMode\(fund\)\),\r?\n\s*managementFees: escapeHtml\(fund\.managementFeeText \|\| "—"\),\r?\n\s*maamad: \`<span style="font-size:13px; font-weight:500; color:var\(--text-soft\);">\$\{getFundMaamad\(fund\)\}<\/span>\`/,
`maamad: \`<span style="font-size:13px; font-weight:500; color:var(--text-soft);">\${getFundMaamad(fund)}</span>\`,\n        investmentTrack: escapeHtml(getInfrastructureYieldMode(fund)),\n        managementFees: escapeHtml(fund.managementFeeText || "—")`);

fs.writeFileSync('retirement_workspace.html', c);
