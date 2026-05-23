const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const rootDir = path.resolve(__dirname, "..");
const inDir = path.join(rootDir, "תשואות");
const outFile = path.join(rootDir, "מערכת פרישה", "assets", "returns-data.js");

const xlsxFile = fs.readdirSync(inDir).find((name) => name.endsWith(".xlsx"));
const pensionFile = fs.readdirSync(inDir).find((name) => name.toLowerCase().endsWith(".xls"));
const xmlFile = fs.readdirSync(inDir).find((name) => name.toLowerCase().endsWith(".xml"));

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value) {
  const text = clean(value).replace(/[$,%]/g, "").replace(/- - -/g, "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalCompany(text) {
  const source = clean(text);
  const names = [
    ["מנורה מבטחים", ["מנורה מבטחים", "מנורה"]],
    ["אלטשולר שחם", ["אלטשולר שחם", "אלטשולר"]],
    ["ילין לפידות", ["ילין לפידות", "ילין"]],
    ["ביטוח ישיר", ["ביטוח ישיר", "איי. די. איי", "אי.די.אי", "איי.די.איי"]],
    ["הפניקס", ["הפניקס", "פניקס"]],
    ["הראל", ["הראל"]],
    ["כלל", ["כלל"]],
    ["מגדל", ["מגדל"]],
    ["מיטב", ["מיטב"]],
    ["מור", ["מור"]],
    ["אנליסט", ["אנליסט"]],
    ["איילון", ["איילון"]],
    ["הכשרה", ["הכשרה"]],
    ["אינפיניטי", ["אינפיניטי"]],
    ["פסגות", ["פסגות"]]
  ];
  return (names.find(([, patterns]) => patterns.some((pattern) => source.includes(pattern))) || [source])[0];
}

function productFromGemel(type) {
  const text = clean(type);
  if (text.includes("חיסכון לכל ילד") || text.includes("חסכון לכל ילד") || text.includes("ילד")) return "חיסכון לכל ילד";
  if (text.includes("השתלמות")) return "קרן השתלמות";
  if (text.includes("להשקעה")) return "קופת גמל להשקעה";
  return "קופת גמל";
}

function inferSpecialization(name, explicit) {
  const text = `${clean(name)} ${clean(explicit)}`;
  if (/s&(amp;)?p|s\s*&\s*p|500|מדד 500/i.test(text)) return "עוקב מדד S&P 500";
  if (/עוקב מדדי מניות/i.test(text)) return "עוקב מדדי מניות";
  if (/מניות סחיר/i.test(text)) return "מניות סחיר";
  if (/מניות/i.test(text)) return "מניות";
  if (/הלכ/i.test(text)) return "הלכה";
  if (/קיימות/i.test(text)) return "קיימות";
  if (/אג.?ח|אגח/i.test(text)) return "אג\"ח";
  if (/עוקב מדד|עוקב מדדים/i.test(text)) return "עוקב מדדים";
  if (/50|60|גיל|יעד לפרישה|קצבה/i.test(text)) return "מסלול גיל / קצבה";
  if (/כספי|שקלי|שיקלי/i.test(text)) return "כספי / שקלי";
  if (/כללי|כלל/i.test(text)) return "כללי";
  return clean(explicit) || "כללי";
}

function makeRow(source, productType, manufacturer, trackName, trackId, extra = {}) {
  return {
    id: "",
    source,
    productType,
    manufacturer: canonicalCompany(manufacturer || trackName),
    trackName: clean(trackName),
    trackId: clean(trackId),
    specialization: inferSpecialization(trackName, extra.specialization),
    reportPeriod: clean(extra.reportPeriod),
    returns: {
      periodAvg: num(extra.periodAvg),
      periodAccumulated: num(extra.periodAccumulated),
      months36Accumulated: num(extra.months36Accumulated),
      months60Accumulated: num(extra.months60Accumulated),
      annual3: num(extra.annual3),
      annual5: num(extra.annual5)
    },
    risk: {
      stdev36: num(extra.stdev36),
      stdev60: num(extra.stdev60),
      alpha: num(extra.alpha),
      sharpe: num(extra.sharpe),
      liquidity: num(extra.liquidity)
    },
    fees: {
      balance: num(extra.feeBalance),
      deposit: num(extra.feeDeposit)
    },
    assets: num(extra.assets),
    rawProductType: clean(extra.rawProductType || productType)
  };
}

const rows = [];

if (xlsxFile) {
  const wb = XLSX.readFile(path.join(inDir, xlsxFile));
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: "" });
  data.forEach((row) => {
    if (!row.SHM_KUPA || row.TAARICH_SIUM_PEILUT) return;
    rows.push(makeRow("gemel", productFromGemel(row.SUG_KUPA), row.SHM_HEVRA_MENAHELET, row.SHM_KUPA, row.ID || row.MISPAR_KUPA_AV, {
      specialization: row.HITMAHUT_MISHNIT || row.HITMAHUT_RASHIT,
      reportPeriod: `${row.MI_TKUFAT_DIVUACH || ""}-${row.AD_TKUFAT_DIVUACH || ""}`,
      periodAvg: row.TSUA_MEMUZAAT_LETKUFA,
      periodAccumulated: row.TSUA_MITZTABERET_LETKUFA,
      months36Accumulated: row.TSUA_MITZTABERET_36_HODASHIM,
      months60Accumulated: row.TSUA_MITZTABERET_60_HODASHIM,
      annual3: row.TSUA_SHNATIT_MEMUZAAT_3_SHANIM,
      annual5: row.TSUA_SHNATIT_MEMUZAAT_5_SHANIM,
      stdev36: row.STIAT_TEKEN_36_HODASHIM,
      stdev60: row.STIAT_TEKEN_60_HODASHIM,
      alpha: row.ALPHA_SHNATIT,
      sharpe: row.SHARP_KOL_HAKUPOT || row.SHARP_ANAF,
      liquidity: row.YAHAS_NEZILUT,
      feeBalance: row.SHIUR_DMEI_NIHUL_AHARON,
      feeDeposit: row.SHIUR_D_NIHUL_AHARON_HAFKADOT,
      assets: row.YITRAT_NCHASIM_LSOF_TKUFA,
      rawProductType: row.SUG_KUPA
    }));
  });
}

if (pensionFile) {
  const wb = XLSX.readFile(path.join(inDir, pensionFile));
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: "" });
  let headerRow = raw.findIndex((row) => clean(row[19]) === "שם");
  const compactHeader = raw.findIndex((row) => clean(row[9]) === "שם");
  const start = headerRow >= 0 ? headerRow + 3 : compactHeader + 2;
  const nameCol = headerRow >= 0 ? 19 : 9;
  for (let index = start; index > 1 && index < raw.length; index += 1) {
    const row = raw[index];
    const name = clean(row[nameCol]);
    if (!name || /סה"כ/.test(name) || /קרנות חדשות|קרנות כלליות|כלל הקרנות/.test(name)) continue;
    rows.push(makeRow("pension", "קרן פנסיה", name, name, row[24] || row[25] || name, {
      reportPeriod: row[15] || row[16],
      periodAccumulated: row[14],
      annual3: row[13],
      annual5: row[11],
      sharpe: row[7],
      feeBalance: row[5],
      feeDeposit: row[6],
      assets: row[3],
      rawProductType: /משלימה|כללית/.test(name) ? "קרן פנסיה משלימה/כללית" : "קרן פנסיה מקיפה"
    }));
  }
}

if (xmlFile) {
  const xml = fs.readFileSync(path.join(inDir, xmlFile), "utf8");
  const xmlRows = xml.match(/<ROW>[\s\S]*?<\/ROW>/g) || [];
  const tag = (row, name) => clean((row.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`)) || [, ""])[1]);
  xmlRows.forEach((row) => {
    const name = tag(row, "SHEM_GUF");
    if (!name || tag(row, "TAARICH_SIUM_PEILUT")) return;
    rows.push(makeRow("policy", "פוליסה פיננסית", name, name, tag(row, "ID_GUF"), {
      reportPeriod: `${tag(row, "MI_TKUFAT_DIVUACH")}-${tag(row, "AD_TKUFAT_DIVUACH")}`,
      periodAvg: tag(row, "TSUA_MEMUZAAT_LETKUFA"),
      periodAccumulated: tag(row, "TSUA_MITZ_LE_TKUFA"),
      months36Accumulated: tag(row, "TSUA_MITZTABERET_36_HODASHIM"),
      months60Accumulated: tag(row, "TSUA_MITZTABERET_60_HODASHIM"),
      annual3: tag(row, "TSUA_SHNATIT_MEMUZAAT_3_SHANIM"),
      annual5: tag(row, "TSUA_SHNATIT_MEMUZAAT_5_SHANIM"),
      stdev36: tag(row, "STIAT_TEKEN_36_HODASHIM"),
      stdev60: tag(row, "STIAT_TEKEN_60_HODASHIM"),
      alpha: tag(row, "ALPHA_SHNATI"),
      sharpe: tag(row, "SHARP_RIBIT_HASRAT_SIKUN") || tag(row, "SHARP_TSUA_HEZYONIT_ANAF"),
      liquidity: tag(row, "YAHAS_NEZILUT"),
      feeBalance: tag(row, "SHIUR_D_NIHUL_NECHASIM"),
      feeDeposit: tag(row, "SHIUR_D_NIHUL_HAFKADOT"),
      assets: tag(row, "YIT_NCHASIM_BFOAL"),
      rawProductType: tag(row, "TKUFAT_HAKAMA") || "פוליסה פיננסית"
    }));
  });
}

const outputRows = rows
  .filter((row) => row.trackName && row.manufacturer)
  .map((row, index) => ({ ...row, id: `${row.source}-${row.trackId || index}-${index}` }));

const payload = `// Generated from ../תשואות on ${new Date().toISOString()}\nwindow.ABD_RETURNS_DATA = ${JSON.stringify(outputRows)};\n`;
fs.writeFileSync(outFile, payload, "utf8");
console.log(`wrote ${outputRows.length} rows to ${outFile}`);
console.log(outputRows.reduce((acc, row) => {
  acc[row.productType] = (acc[row.productType] || 0) + 1;
  return acc;
}, {}));
