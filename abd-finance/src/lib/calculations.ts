/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import * as XLSX from "xlsx";
import JSZip from "jszip";

// TODO: remove DOM dependency
export async function importClearinghouseZip(buffer, fileName) {
    const zip = await window.JSZip.loadAsync(buffer);
    const xmlEntries = Object.keys(zip.files).filter((name) => name.toLowerCase().endsWith(".xml"));
    const documents = [];
    let client = null;

    for (const entryName of xmlEntries) {
      const xmlText = await zip.files[entryName].async("string");
      const xml = new DOMParser().parseFromString(xmlText, "application/xml");
      if (xml.getElementsByTagName("parsererror").length) {
        console.warn(`[ABD-finance][importClearinghouseZip] קובץ XML פגום: ${entryName}`);
        documents.push({ client: null, funds: [], insurancePolicies: [] });
        continue;
      }
      const parsed = parseClearinghouseDocument(xml, entryName, fileName);
      if (!client && parsed.client) {
        client = parsed.client;
      }
      documents.push(parsed);
    }

    const funds = documents.flatMap((document) => document.funds || []);
    const mergedClient = documents.reduce((result, document) => mergeClientRecords(result, document.client), client);

    return {
      kind: "retirement",
      client: mergedClient,
      funds,
      insurancePolicies: [],
      derivedFactor: getWeightedBaseFactor(funds, 140)
    };
  }

export function parseClearinghouseDocument(xml, entryName, fileName) {
    const manufacturer = getSingleXmlTextValue(xml, ["SHEM-YATZRAN"]);
    const employerDirectory = buildClearinghouseEmployerDirectory(xml);
    const clientNode = firstXmlNode(xml, "YeshutLakoach");
    const client = clientNode ? {
      firstName: getXmlText(clientNode, ["SHEM-PRATI"]),
      lastName: getXmlText(clientNode, ["SHEM-MISHPACHA"]),
      fullName: [getXmlText(clientNode, ["SHEM-PRATI"]), getXmlText(clientNode, ["SHEM-MISHPACHA"])].filter(Boolean).join(" "),
      idNumber: trimLeadingZeros(getXmlText(clientNode, ["MISPAR-ZIHUY-LAKOACH"])),
      email: getXmlText(clientNode, ["E-MAIL"]),
      phone: getXmlText(clientNode, ["MISPAR-CELLULARI", "MISPAR-TELEPHONE-KAVI"])
    } : null;

    const policyNodes = Array.from(xml.getElementsByTagName("HeshbonOPolisa"));
    const coverageNodes = Array.from(xml.getElementsByTagName("ZihuiKisui"));
    const funds = [];
    const policyRows = [];

    policyNodes.forEach((policyNode, index) => {
      const accountNumber = getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON"]) || getXmlText(policyNode, ["MISPAR-POLISA-O-HESHBON-NEGDI"]);
      const planName = getXmlText(policyNode, ["SHEM-TOCHNIT"]) || getXmlText(policyNode, ["SHEM-MASLOL"]) || extractSourceLabelFromFile(entryName);
      const startDate = formatXmlDate(getXmlText(policyNode, ["TAARICH-HITZTARFUT-MUTZAR", "TAARICH-TCHILAT-HABITUACH", "TAARICH-TCHILAT-KISUY"]));
      const endDate = formatXmlDate(getXmlText(policyNode, ["TAARICH-TOM-TKUFAT-HABITUAH", "TAARICH-TOM-KISUY", "TAARICH-HAFSAKAT-TASHLUM"]));
      const liquidityDate = formatXmlDate(getXmlText(policyNode, [
        "MOED-NEZILUT-TAGMULIM",
        "MOED-NEZILUT",
        "MOED-NEZILUT-KESAFIM",
        "TAARICH-NEZILUT",
        "TAARICH-ZAKAUT-LEMESHICHA",
        "TAARICH-ZAKAUT-LE-MESHICHA",
        "TAARICH-TCHILAT-ZAKAUT-LEMESHICHA"
      ]));
      const periodText = [startDate, endDate].map((item) => String(item || "").trim()).filter(Boolean).join(" - ");
      const trackNodes = Array.from(policyNode.getElementsByTagName("PerutMasluleiHashkaa"));
      const yitrotNodes = Array.from(policyNode.getElementsByTagName("PerutYitrot"));
      const periodNodes = Array.from(policyNode.getElementsByTagName("PerutYitraLeTkufa"));
      const retirementNode = firstXmlNode(policyNode, "YitraLefiGilPrisha");
      const directCoverageNodes = Array.from(policyNode.getElementsByTagName("ZihuiKisui"));
      const currentBalance = firstPositive(
        sumBy(yitrotNodes, (row) => firstPositive(
          getXmlNumber(row, ["TOTAL-CHISACHON-MTZBR"]),
          getXmlNumber(row, ["TOTAL-ERKEI-PIDION"]),
          0
        )),
        getXmlNumber(policyNode, ["TOTAL-CHISACHON-MTZBR"]),
        getXmlNumber(policyNode, ["TOTAL-ERKEI-PIDION"]),
        0
      );
      const retirementCapital = firstPositive(
        getXmlNumber(retirementNode || policyNode, [
          "TOTAL-SCHUM-MTZBR-TZAFUY-LEGIL-PRISHA-MECHUSHAV-LEKITZBA-IM-PREMIYOT",
          "TOTAL-SCHUM-MITZVTABER-TZFUY-LEGIL-PRISHA-MECHUSHAV-HAMEYOAD-LEKITZBA-LELO-PREMIYOT",
          "TOTAL-CHISACHON-MITZTABER-TZAFUY",
          "TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT"
        ]),
        currentBalance,
        0
      );
      const importedPension = firstPositive(
        getXmlNumber(retirementNode || policyNode, ["KITZVAT-HODSHIT-TZFUYA", "SCHUM-KITZVAT-ZIKNA"]),
        0
      );
      const guaranteedCoefficient = firstPositive(
        getXmlNumber(retirementNode || policyNode, ["MEKADEM-MOVTACH-LEPRISHA"]),
        importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : NaN,
        0
      );
      const investmentTrack = getXmlText(trackNodes[0] || policyNode, ["SHEM-MASLUL-HASHKAA"]);
      const policyManufacturer = inferManufacturerFromText(`${planName} ${investmentTrack} ${entryName}`)
        || getClearinghousePolicyManufacturer(policyNode, manufacturer);
      const managementFees = getClearinghouseManagementFees(policyNode, trackNodes);
      const depositFee = managementFees.depositFee;
      const balanceFee = managementFees.balanceFee;
      const statusCode = getXmlText(policyNode, ["STATUS-POLISA-O-CHESHBON"]);
      const hasFundSignals = currentBalance > 0 || retirementCapital > 0 || importedPension > 0 || periodNodes.length > 0 || trackNodes.length > 0;
      const employers = extractClearinghouseEmployers(policyNode, employerDirectory);
      const depositRows = extractClearinghouseDepositRows(policyNode, employers);

      const clearingProductType = getClearinghouseProductType(entryName, planName, policyNode);
      const isRetirementSavingsOnly = isRetirementSavingsProduct(clearingProductType, planName);

      if (hasFundSignals) {
        funds.push({
          id: `clearing-fund-${fileName}-${entryName}-${index + 1}`,
          accountNumber: accountNumber || `חשבון-${index + 1}`,
          manufacturer: policyManufacturer || "ללא יצרן",
          productType: clearingProductType,
          productName: planName,
          planName,
          startDate,
          liquidityDate,
          investmentTrack,
          guaranteedYieldFlag: getXmlText(policyNode, ["AVTACHT-TESOA"]),
          status: mapClearinghouseStatus(statusCode),
          currentBalance,
          retirementCapital,
          guaranteedCoefficient: roundNumber(guaranteedCoefficient, 2),
          importedPension,
          retirementAge: getXmlNumber(retirementNode || policyNode, ["GIL-PRISHA"]) || 0,
          retirementTrackName: getXmlText(retirementNode || policyNode, ["SHEM-MASLOL"]),
          depositFee,
          balanceFee,
          recommendation: "",
          notes: extractSourceLabelFromFile(entryName),
          managementFeeDepositText: formatManagementFeeValue(depositFee),
          managementFeeBalanceText: formatManagementFeeValue(balanceFee),
          managementFeeText: buildManagementFeeTextFromValues(depositFee, balanceFee),
          beneficiaries: [],
          employers,
          depositRows,
          periodRows: periodNodes.map((periodNode, periodIndex) => ({
            id: `${accountNumber || index}-period-${periodIndex + 1}`,
            productType: clearingProductType,
            manufacturer: policyManufacturer,
            periodCode: getXmlText(periodNode, ["KOD-TECHULAT-SHICHVA"]),
            periodLabel: mapClearinghouseLayerCode(getXmlText(periodNode, ["KOD-TECHULAT-SHICHVA"])),
            componentCode: getXmlText(periodNode, ["REKIV-ITRA-LETKUFA"]),
            componentLabel: mapClearinghouseComponentCode(getXmlText(periodNode, ["REKIV-ITRA-LETKUFA"])),
            balanceTypeCode: getXmlText(periodNode, ["SUG-ITRA-LETKUFA"]),
            balanceTypeLabel: mapClearinghouseBalanceTypeCode(getXmlText(periodNode, ["SUG-ITRA-LETKUFA"])),
            amount: getXmlNumber(periodNode, ["SACH-ITRA-LESHICHVA-BESHACH"]),
            benefitCap: getXmlText(periodNode, ["TIKRAT-HAFKADA-MUTEVET"])
          }))
        });
      } else if (!isRetirementSavingsOnly) {
        const baseCoverageAmount = firstPositive(
          getXmlNumber(policyNode, ["SCHUM-BITUACH", "SCHUM-BITUAH-LEMAVET"]),
          0
        );
        const basePremium = firstPositive(
          getXmlNumber(policyNode, ["DMEI-BITUAH-LETASHLUM-BAPOAL", "PREMIA-ZFOYA"]),
          0
        );
        policyRows.push({
          id: `clearing-policy-${entryName}-${index + 1}`,
          source: "clearinghouse",
          sourceLabel: "מסלקה",
          manufacturer: policyManufacturer,
          mainBranch: extractSourceLabelFromFile(entryName),
          secondaryBranch: "",
          itemClass: isInsuranceSavingsProduct(clearingProductType, planName) ? "פוליסת חיסכון ביטוחית" : "פוליסת ביטוח",
          productType: isInsuranceSavingsProduct(clearingProductType, planName) ? "חיסכון עם רכיב ביטוחי" : "פוליסת ביטוח",
          planName,
          policyNumber: accountNumber,
          periodText: periodText || "—",
          premium: basePremium,
          premiumText: basePremium ? fmtCurrency(basePremium) : "",
          coverageAmount: baseCoverageAmount,
          coverageAmountText: baseCoverageAmount ? fmtCurrency(baseCoverageAmount) : "",
          client
        });
      }

      if (currentBalance <= 0 && retirementCapital <= 0 && importedPension <= 0 && shouldIncludeClearinghouseCoverage(clearingProductType, planName, extractSourceLabelFromFile(entryName))) {
        directCoverageNodes.forEach((coverageNode, coverageIndex) => {
          const coverageName = getXmlText(coverageNode, ["SHEM-KISUI-YATZRAN"]) || planName;
          if (!isInsuranceLikeCoverageName(coverageName, planName)) return;
          const coverageAmount = firstPositive(
            getXmlNumber(coverageNode, ["SCHUM-BITUACH", "SCHUM-BITUAH-LEMAVET"]),
            getXmlNumber(coverageNode, ["SCHUM-BITUH-ZFOY"]),
            0
          );
          const premium = firstPositive(
            getXmlNumber(coverageNode, ["DMEI-BITUAH-LETASHLUM-BAPOAL", "PREMIA-ZFOYA"]),
            0
          );
          policyRows.push({
          id: `clearing-coverage-${entryName}-${index + 1}-${coverageIndex + 1}`,
          source: "clearinghouse",
          sourceLabel: "מסלקה",
          manufacturer: policyManufacturer,
            mainBranch: extractSourceLabelFromFile(entryName),
            secondaryBranch: coverageName,
            itemClass: "כיסוי ביטוחי",
            productType: "כיסוי",
            planName: coverageName,
            policyNumber: accountNumber,
            periodText: periodText || "—",
            premium,
            premiumText: premium ? fmtCurrency(premium) : "",
            coverageAmount,
            coverageAmountText: coverageAmount ? fmtCurrency(coverageAmount) : "",
            client
          });
        });
      }
    });

    return {
      client,
      funds,
      insurancePolicies: []
    };
  }

export function buildClearinghouseEmployerDirectory(xml) {
    const map = new Map();
    Array.from(xml.getElementsByTagName("YeshutMaasik")).forEach((node) => {
      const name = getXmlText(node, ["SHEM-MAASIK", "SHEM-MESHALEM"]);
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MPR-MAASIK-BE-YATZRAN", "MISPAR-ZIHUY-MAASIK", "MISPAR-ZIHUY-MESHALEM"]));
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name);
      if (!idNumber && !name) return;
      registerEmployerDirectoryItem(map, { rawIdNumber, idNumber, name });
    });
    return map;
  }

export function extractClearinghouseEmployers(policyNode, employerDirectory) {
    const employers = new Map();
    const activeEmployerIds = new Set();
    Array.from(policyNode.getElementsByTagName("PirteiOved")).forEach((node) => {
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MPR-MAASIK-BE-YATZRAN", "MISPAR-ZIHUY-MAASIK"]));
      const isCurrent = getXmlText(node, ["STATUS-MAASIK"]) === "1";
      const nodeName = getXmlText(node, ["SHEM-MAASIK"]);
      const directoryItem = findEmployerDirectoryItem(employerDirectory, rawIdNumber, "", nodeName);
      const name = nodeName || (directoryItem && directoryItem.name) || "";
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || (directoryItem && directoryItem.idNumber) || "";
      if (isCurrent && idNumber) activeEmployerIds.add(idNumber);
      if (!idNumber && !name) return;
      const key = idNumber || normalizeText(name);
      const existing = employers.get(key) || {};
      employers.set(key, {
        idNumber: existing.idNumber || idNumber,
        name: existing.name || name,
        isCurrent: Boolean(existing.isCurrent || isCurrent)
      });
    });
    Array.from(policyNode.getElementsByTagName("NetuneiGvia")).forEach((node) => {
      const name = getXmlText(node, ["SHEM-MESHALEM"]);
      const rawIdNumber = normalizeDigits(getXmlText(node, ["MISPAR-ZIHUY-MESHALEM"]));
      const directoryItem = findEmployerDirectoryItem(employerDirectory, rawIdNumber, "", name);
      const idNumber = normalizeEmployerIdForDisplay(rawIdNumber, name) || (directoryItem && directoryItem.idNumber) || "";
      if (!idNumber && !name) return;
      const key = idNumber || normalizeText(name);
      if (!employers.has(key)) {
        employers.set(key, { idNumber, name, isCurrent: activeEmployerIds.has(idNumber) });
      }
    });
    if (!employers.size && employerDirectory.size === 1) {
      const onlyEmployer = Array.from(employerDirectory.values())[0];
      employers.set(onlyEmployer.idNumber || normalizeText(onlyEmployer.name), {
        ...onlyEmployer,
        isCurrent: true
      });
    }
    const list = Array.from(employers.values());
    if (list.length && !list.some((item) => item.isCurrent)) {
      list[0].isCurrent = true;
    }
    return list;
  }

export function normalizeDepositCode(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.replace(/^0+(?=\d)/, "");
}

export function classifyDepositComponent(node) {
    const depositorCode = normalizeDepositCode(getXmlText(node, ["SUG-MAFKID", "SUG-HAMAFKID"]));
    const contributionCode = normalizeDepositCode(getXmlText(node, ["SUG-HAFRASHA", "KOD-SUG-HAFRASHA", "KOD-SUG-HAFKADA"]));
    if (["3", "4", "10"].includes(contributionCode)) return "compensation";
    if (["1", "8"].includes(contributionCode)) return "employee";
    if (["2", "9"].includes(contributionCode)) return "employer";
    if (depositorCode === "1") return "employee";
    if (depositorCode === "2") return "employer";
    return "employer";
}

export function extractClearinghouseDepositRows(policyNode, employers) {
    const currentEmployer = employers.find((item) => item.isCurrent) || employers[0] || {};
    const nodesFromYear = Array.from(policyNode.getElementsByTagName("PerutHafkadotMetchilatShana"));
    const latestNodes = Array.from(policyNode.getElementsByTagName("PerutHafkadaAchrona"));
    const sourceNodes = nodesFromYear.length ? nodesFromYear : latestNodes;
    const byMonth = new Map();
    sourceNodes.forEach((node) => {
      const amount = firstPositive(
        getXmlNumber(node, ["SCHUM-HAFKADA-SHESHULAM"]),
        getXmlNumber(node, ["SCHUM-HAFRASHA"]),
        getXmlNumber(node, ["SCHUM-HAFKADA"]),
        getXmlNumber(node, ["SACH-HAFKADA"]),
        getXmlNumber(node, ["TOTAL-HAFKADA"]),
        getXmlNumber(node, ["TOTAL-HAFKADA-ACHRONA"]),
        0
      );
      if (!amount) return;
      const month = formatDepositMonth(
        getXmlText(node, ["CHODESH-SACHAR", "TAARICH-HAFKADA-ACHARON", "TAARICH-ERECH-HAFKADA", "TAARICH-MADAD"])
      );
      const employerName = getXmlText(node, ["SHEM-MAASIK", "SHEM-MESHALEM"]) || currentEmployer.name || "—";
      const key = `${month || "ללא חודש"}|${normalizeText(employerName)}`;
      const row = byMonth.get(key) || {
        employerName,
        employerId: currentEmployer.idNumber || "",
        month,
        contributionCodes: [],
        depositorCodes: [],
        employeeContribution: 0,
        employerContribution: 0,
        compensation: 0,
        total: 0
      };
      const contributionCode = normalizeDepositCode(getXmlText(node, ["SUG-HAFRASHA", "KOD-SUG-HAFRASHA", "KOD-SUG-HAFKADA"]));
      const depositorCode = normalizeDepositCode(getXmlText(node, ["SUG-MAFKID", "SUG-HAMAFKID"]));
      if (contributionCode && !row.contributionCodes.includes(contributionCode)) row.contributionCodes.push(contributionCode);
      if (depositorCode && !row.depositorCodes.includes(depositorCode)) row.depositorCodes.push(depositorCode);
      const component = classifyDepositComponent(node);
      if (component === "employee") row.employeeContribution += amount;
      if (component === "employer") row.employerContribution += amount;
      if (component === "compensation") row.compensation += amount;
      row.total += amount;
      byMonth.set(key, row);
    });
    return Array.from(byMonth.values()).sort((a, b) => normalizeText(b.month).localeCompare(normalizeText(a.month)));
  }

export function getClearinghouseProductType(entryName, planName, policyNode) {
    const sourceLabel = extractSourceLabelFromFile(entryName);
    const normalizedPlan = normalizeText(planName);
    const productCode = getXmlText(policyNode, ["SUG-MUTZAR", "SUG-TOCHNIT-O-CHESHBON"]);
    if (sourceLabel === "קרן פנסיה") return "קרן פנסיה";
    if (sourceLabel === "קרן השתלמות" || normalizedPlan.includes("השתל")) return "קרן השתלמות";
    if (sourceLabel === "קופת גמל") return "קופת גמל";
    if (sourceLabel === "ביטוח" || sourceLabel === "ביטוח / חיסכון") {
      if (normalizedPlan.includes("חיסכון")) return "פוליסת חיסכון";
      return "ביטוח";
    }
    if (String(productCode) === "1") return "ביטוח";
    if (String(productCode) === "4") return "קופת גמל";
    return sourceLabel;
  }

export function getClearinghouseManagementFees(policyNode, trackNodes) {
    const tracks = Array.isArray(trackNodes) ? trackNodes : [];
    const expensesNode = firstXmlNode(policyNode, "HotzaotBafoalLehodeshDivoach");
    const depositFee = firstMeaningfulFeeNumber(
      ...getXmlFeeStructureValues(policyNode, "deposit"),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HAFKADA"], "deposit")),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HAFKADA-MIVNE"], "deposit")),
      getDirectXmlPercent(expensesNode, ["SHEUR-DMEI-NIHUL-HAFKADA"], "deposit"),
      getDirectXmlPercent(expensesNode, ["MEMOTZA-SHEUR-DMEI-NIHUL-HAFKADA"], "deposit")
    );
    const balanceFee = firstMeaningfulFeeNumber(
      ...getXmlFeeStructureValues(policyNode, "balance"),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HISACHON"], "balance")),
      ...tracks.map((trackNode) => getDirectXmlPercent(trackNode, ["SHEUR-DMEI-NIHUL-HISACHON-MIVNE"], "balance")),
      getDirectXmlPercent(expensesNode, ["SHEUR-DMEI-NIHUL-HISACHON"], "balance"),
      getMonthlyXmlPercentAsAnnual(expensesNode || policyNode, ["SHEUR-DMEI-NIHUL-TZVIRA"])
    );
    return { depositFee, balanceFee };
  }

export function getClearinghousePolicyManufacturer(policyNode, fallbackManufacturer) {
    const direct = getDirectXmlText(policyNode, ["SHEM-YATZRAN", "SHEM-GUF-MOSDI", "SHEM-HEVRA"]);
    if (direct) return direct;
    let current = policyNode ? policyNode.parentNode : null;
    while (current && current.nodeType === 1) {
      const tagName = String(current.nodeName || "");
      if (/YeshutYatzran|NetuneiMutzar|MivneMutzar|^Mutzar$/i.test(tagName)) {
        const ancestorManufacturer = getDirectXmlText(current, ["SHEM-YATZRAN", "SHEM-GUF-MOSDI", "SHEM-HEVRA"]);
        if (ancestorManufacturer) return ancestorManufacturer;
      }
      current = current.parentNode;
    }
    return fallbackManufacturer || "";
  }

export function shouldIncludeClearinghouseCoverage(productType, planName, sourceLabel) {
    if (isRetirementSavingsProduct(productType, planName)) return false;
    const normalizedSource = normalizeText(sourceLabel);
    return normalizedSource.includes("ביטוח")
      || isInsuranceSavingsProduct(productType, planName);
  }

export function isHarHabituachWorkbook(workbook) {
    return Boolean(findHarHabituachWorksheet(workbook));
  }

export function findHarHabituachWorksheet(workbook) {
    if (!workbook || !Array.isArray(workbook.SheetNames)) return null;
    const candidates = workbook.SheetNames.map((name) => ({
      name,
      worksheet: workbook.Sheets[name],
      score: normalizeText(name).includes(normalizeText("תיק ביטוחי")) ? 2 : 0
    })).filter((item) => item.worksheet);

    for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
      expandWorksheetRefToActualCells(candidate.worksheet);
      const rows = window.XLSX.utils.sheet_to_json(candidate.worksheet, {
        header: 1,
        blankrows: false,
        raw: true,
        defval: ""
      });
      const headerIndex = findHarHabituachHeaderIndex(rows);
      if (headerIndex !== -1) {
        return { ...candidate, rows, headerIndex };
      }
    }
    return null;
  }

export function expandWorksheetRefToActualCells(worksheet) {
    if (!worksheet || !window.XLSX || !window.XLSX.utils) return;
    const cellKeys = Object.keys(worksheet).filter((key) => /^[A-Z]+\d+$/i.test(key));
    if (!cellKeys.length) return;

    let range = worksheet["!ref"]
      ? window.XLSX.utils.decode_range(worksheet["!ref"])
      : { s: { r: Infinity, c: Infinity }, e: { r: -1, c: -1 } };

    cellKeys.forEach((key) => {
      const cell = window.XLSX.utils.decode_cell(key);
      range.s.r = Math.min(range.s.r, cell.r);
      range.s.c = Math.min(range.s.c, cell.c);
      range.e.r = Math.max(range.e.r, cell.r);
      range.e.c = Math.max(range.e.c, cell.c);
    });

    worksheet["!ref"] = window.XLSX.utils.encode_range(range);
  }

export function findHarHabituachHeaderIndex(rows) {
    let bestIndex = -1;
    let bestScore = 0;
    rows.forEach((row, index) => {
      if (!Array.isArray(row)) return false;
      const cells = row.map((cell) => normalizeComparable(getTextFromCell(cell))).filter(Boolean);
      if (!cells.length) return;
      const hasPolicy = cells.some((cell) => cell.includes("מספרפוליסה") || cell.includes("מספוליסה") || cell.includes("פוליסה"));
      const hasCompany = cells.some((cell) => cell.includes("חברה") || cell.includes("חברתביטוח") || cell.includes("שםמבטח") || cell.includes("מבטח") || cell.includes("יצרן"));
      const hasBranch = cells.some((cell) => cell.includes("ענףראשי") || cell.includes("ענףמשני") || cell.includes("תחוםביטוח") || cell.includes("תחום") || cell.includes("כיסוי"));
      const hasInsuranceSignal = cells.some((cell) => cell.includes("פרמיה") || cell.includes("סכוםביטוח") || cell.includes("סכוםכיסוי") || cell.includes("תקופתביטוח") || cell.includes("תאריךתחילה"));
      const hasPlan = cells.some((cell) => cell.includes("שםתוכנית") || cell.includes("שםתכנית") || cell.includes("סיווגתוכנית") || cell.includes("סוגמוצר"));
      const score = (hasPolicy ? 3 : 0) + (hasCompany ? 3 : 0) + (hasBranch ? 2 : 0) + (hasInsuranceSignal ? 2 : 0) + (hasPlan ? 1 : 0);
      if (score > bestScore && hasPolicy && (hasCompany || hasBranch || hasInsuranceSignal || hasPlan)) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestScore >= 5 ? bestIndex : -1;
  }

export function importHarHabituachWorkbook(workbook, workbookName) {
    const detected = findHarHabituachWorksheet(workbook);
    const rows = detected ? detected.rows : [];
    const headerIndex = detected ? detected.headerIndex : -1;
    if (headerIndex === -1) {
      throw new Error("לא הצלחתי לזהות את מבנה קובץ הר הביטוח.");
    }

    const headers = (rows[headerIndex] || []).map((cell) => getTextFromCell(cell));
    const exportDate = findHarHabituachExportDate(rows);
    let currentBranch = "";
    const policies = [];
    let clientId = "";

    rows.slice(headerIndex + 1).forEach((row) => {
      const normalized = Array.isArray(row) ? row.map((cell) => getTextFromCell(cell)) : [];
      if (!normalized.some(Boolean)) return;
      if (normalized.every((cell) => !cell || isWorkbookPlaceholder(cell))) return;

      const record = {};
      headers.forEach((header, index) => {
        if (header) {
          record[header] = normalized[index] || "";
        }
      });

      const mainBranch = getText(record, ["ענף ראשי", "תחום ביטוח", "תחום הביטוח", "תחום", "ענף", "קבוצת ביטוח"]);
      const secondaryBranch = getText(record, ["ענף (משני)", "ענף משני", "כיסוי", "שם כיסוי", "סוג כיסוי", "שם הכיסוי", "כיסויים"]);
      const company = getText(record, ["חברה", "שם חברה", "חברת ביטוח", "שם חברת ביטוח", "שם מבטח", "מבטח", "יצרן", "שם יצרן"]);
      const policyNumber = getText(record, ["מספר פוליסה", "מס' פוליסה", "מס פוליסה", "פוליסה", "מספר הפוליסה", "מספר חוזה"]);
      const classification = getText(record, ["סיווג תכנית", "סיווג תוכנית", "שם תכנית", "שם תוכנית", "שם פוליסה", "שם התכנית", "שם התוכנית", "שם מוצר"]);
      const productType = getText(record, ["סוג מוצר", "מוצר", "סוג ביטוח", "סוג פוליסה", "סוג התכנית", "סוג התוכנית", "סוג כיסוי"]);
      const periodText = getText(record, ["תקופת ביטוח", "תקופת הביטוח", "תקופה", "מועד תחילת ביטוח", "תאריך תחילת ביטוח", "תאריך תחילה", "תאריך הצטרפות"]);
      const premiumType = getText(record, ["סוג פרמיה", "אופן תשלום", "סוג תשלום", "תדירות תשלום", "תדירות פרמיה"]);
      const premium = getNumber(record, ["פרמיה בש\"ח", "פרמיה חודשית", "פרמיה", "דמי ביטוח", "עלות חודשית", "תשלום חודשי"]);
      const coverageAmount = getNumber(record, ["סכום ביטוח", "סכום ביטוח בש\"ח", "סכום כיסוי", "גובה כיסוי", "סכום מבוטח"]);
      const ownerId = trimLeadingZeros(getText(record, ["תעודת זהות", "ת.ז.", "מספר זהות", "מספר תעודת זהות", "תז מבוטח", "תעודת זהות מבוטח"]));
      const moreDetails = getText(record, ["פרטים נוספים", "הערות", "פירוט", "תיאור", "מידע נוסף"]);
      if ([mainBranch, secondaryBranch, company, policyNumber, classification, productType].every((value) => !value || isWorkbookPlaceholder(value))) {
        return;
      }

      const isBranchRow = mainBranch.startsWith("תחום -") && !secondaryBranch && !company && !policyNumber;
      if (isBranchRow) {
        currentBranch = mainBranch;
        return;
      }

      if (!policyNumber && !company && !secondaryBranch) {
        return;
      }

      clientId = clientId || ownerId;
      policies.push({
        id: `har-${workbookName}-${policies.length + 1}`,
        source: "har-habituach",
        sourceLabel: "הר הביטוח",
        mainBranch: mainBranch || currentBranch,
        categoryBranch: currentBranch,
        secondaryBranch,
        itemClass: classifyHarHabituachPolicy(mainBranch || currentBranch, productType, classification),
        productType,
        manufacturer: company,
        periodText,
        premium: Number.isFinite(premium) ? premium : 0,
        premiumText: Number.isFinite(premium) ? fmtCurrency(premium) : "",
        premiumType,
        policyNumber,
        planName: classification || productType,
        coverageAmount: Number.isFinite(coverageAmount) ? coverageAmount : 0,
        coverageAmountText: Number.isFinite(coverageAmount) ? fmtCurrency(coverageAmount) : "",
        exportDate,
        moreDetails,
        client: {
          idNumber: clientId
        }
      });
    });

    return {
      kind: "insurance",
      client: {
        idNumber: clientId
      },
      funds: [],
      insurancePolicies: policies,
      derivedFactor: 140
    };
  }

export function findHarHabituachExportDate(rows) {
    for (const row of rows.slice(0, 4)) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        const text = getTextFromCell(cell);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
          return text;
        }
      }
    }
    return "";
  }

export function isHarHabituachPolicy(policy) {
    return Boolean(policy && (policy.source === "har-habituach" || policy.sourceLabel === "הר הביטוח"));
  }

export function classifyHarHabituachPolicy(mainBranch, productType, classification) {
    const branchText = normalizeText(mainBranch);
    const combined = normalizeText([productType, classification].filter(Boolean).join(" "));
    if (combined.includes("מנהלים") || combined.includes("פוליסת חיסכון")) return "פוליסת חיסכון ביטוחית";
    if (branchText.includes("פנסיה")) return "חיסכון פנסיוני";
    if (branchText.includes("חיים") || branchText.includes("בריאות") || branchText.includes("תאונות") || branchText.includes("סיעוד")) return "פוליסת ביטוח";
    return "פוליסת ביטוח";
  }

export function parseClient(record) {
    const fullName = getText(record, ["שם מלא"]) || [getText(record, ["שם פרטי"]), getText(record, ["שם משפחה"])].filter(Boolean).join(" ");
    return {
      firstName: getText(record, ["שם פרטי"]),
      lastName: getText(record, ["שם משפחה"]),
      fullName,
      idNumber: getText(record, ["מספר מזהה"]),
      email: getText(record, ["אימייל"]),
      phone: getText(record, ["מספר פלאפון"]),
      address: getText(record, ["כתובת"]),
      gender: getText(record, ["מין"]),
      age: toNumber(getText(record, ["גיל"])) || null
    };
  }

export function buildFunds(productRows, balanceRows, periodRows, retirementRows, beneficiaryRows, workbookName) {
    const balancesByAccount = groupBy(balanceRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));
    const periodsByAccount = groupBy(periodRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));
    const retirementByAccount = new Map();
    retirementRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) retirementByAccount.set(account, row);
    });
    const beneficiariesByAccount = groupBy(beneficiaryRows, (row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])));

    const accounts = new Set();
    productRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });
    retirementRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });
    periodRows.forEach((row) => {
      const account = normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"]));
      if (account) accounts.add(account);
    });

    const funds = [];
    let fallbackIndex = 1;
    accounts.forEach((account) => {
      const product = productRows.find((row) => normalizeAccount(getText(row, ["מס' פוליסה/חשבון", "מס פוליסה/חשבון"])) === account) || {};
      const retirement = retirementByAccount.get(account) || {};
      const balances = balancesByAccount.get(account) || [];
      const periodEntries = periodsByAccount.get(account) || [];
      const beneficiaryEntries = beneficiariesByAccount.get(account) || [];

      const currentBalance = firstPositive(
        getNumber(product, ["צבירה"]),
        sumBy(balances, (row) => getNumber(row, ["סה\"כ חיסכון מצטבר"])),
        sumBy(balances, (row) => getNumber(row, ["סה\"כ ערכי פדיון"])),
        0
      );

      const retirementCapital = firstPositive(
        getNumber(retirement, ["קופה משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (כולל פרמיות עתידיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סה\"כ סכום מצטבר צפוי לגיל פרישה מחושב המיועד לקצבה (ללא פרמיות עתידיות)"]),
        getNumber(retirement, ["סה\"כ סכום חיסכון מצטבר צפוי בגיל פרישה (כולל פרמיות)"]),
        getNumber(retirement, ["צבירת חיסכון חזויה לגיל פרישה לחישוב (ללא פרמיות)"]),
        currentBalance,
        0
      );

      const importedPension = firstPositive(
        getNumber(retirement, ["קופה משלמת | סכום קצבת זקנה"]),
        getNumber(retirement, ["קופה משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)"]),
        getNumber(retirement, ["קופה לא משלמת | סכום קצבת זקנה"]),
        getNumber(retirement, ["קופה לא משלמת | קצבת זקנה/גמלא חודשית צפויה (ללא פרמיות)"]),
        getNumber(retirement, ["סכום קצבת זקנה"]),
        getNumber(retirement, ["קצבת זקנה/גמלא חודשית צפויה"]),
        0
      );

      const factorFromImport = firstPositive(
        getNumber(retirement, ["מקדם מובטח לפרישה"]),
        importedPension > 0 && retirementCapital > 0 ? retirementCapital / importedPension : NaN,
        0
      );

      const beneficiaries = beneficiaryEntries.map((entry, index) => ({
        id: `${account}-beneficiary-${index + 1}`,
        name: [getText(entry, ["שם פרטי"]), getText(entry, ["שם משפחה"])].filter(Boolean).join(" "),
        relationship: getText(entry, ["זיקת מוטב למבוטח"]),
        share: normalizeShare(getText(entry, ["חלק המוטב באחוזים"])),
        definition: getText(entry, ["הגדרת מוטב"]),
        type: getText(entry, ["מהות מוטב"])
      }));

      funds.push({
        id: `${account || workbookName}-${fallbackIndex++}`,
        accountNumber: account.replace(/^0+(?=\d)/, "") || `חשבון-${fallbackIndex}`,
        manufacturer: getText(product, ["יצרן"]) || getText(retirement, ["יצרן"]) || "ללא יצרן",
        productType: getText(product, ["סוג מוצר"]) || getText(retirement, ["סוג מוצר"]) || "מוצר לא מזוהה",
        productName: getText(product, ["מוצר"]),
        planName: getText(product, ["שם תוכנית"]),
        startDate: getText(product, ["תאריך הצטרפות"]),
        liquidityDate: getText(product, ["תאריך נזילות", "מועד נזילות", "תאריך נזילות תגמולים", "מועד נזילות תגמולים", "תאריך זכאות למשיכה", "מועד זכאות למשיכה"]),
        investmentTrack: getText(product, ["מסלולי השקעה"]),
        guaranteedYieldFlag: getText(product, ["קיים מקדם המרה המגלם הבטחת תשואה"]),
        status: getText(product, ["סטטוס"]) || "לא ידוע",
        currentBalance,
        retirementCapital,
        guaranteedCoefficient: roundNumber(factorFromImport, 2),
        importedPension,
        retirementAge: getNumber(retirement, ["גיל פרישה לחישוב"]) || 0,
        retirementTrackName: getText(retirement, ["שם מסלול פרישה"]),
        recommendation: getText(retirement, ["המלצה"]) || getText(product, ["המלצה"]),
        notes: [getText(product, ["הערות"]), getText(retirement, ["הערות"])].filter(Boolean).join(" | "),
        managementFeeDepositText: extractManagementFeeText(product, retirement, "deposit"),
        managementFeeBalanceText: extractManagementFeeText(product, retirement, "balance"),
        managementFeeText: buildManagementFeeDisplay(product, retirement),
        beneficiaries,
        periodRows: periodEntries.map((entry, index) => ({
          id: `${account}-period-${index + 1}`,
          productType: getText(entry, ["סוג מוצר"]),
          manufacturer: getText(entry, ["יצרן"]),
          periodCode: "",
          periodLabel: getText(entry, ["תקופת יתרה"]),
          componentCode: "",
          componentLabel: getText(entry, ["רכיב יתרה לתקופה"]),
          balanceTypeCode: "",
          balanceTypeLabel: getText(entry, ["סוג יתרה לתקופה"]),
          amount: getNumber(entry, ["סה\"כ יתרה תקופה"]),
          benefitCap: getText(entry, ["תקרת ההפקדה המוטבת"])
        }))
      });
    });

    return funds.sort(compareFunds("manufacturer-asc"));
  }

export function mergeFunds(currentFunds, nextFunds) {
    const duplicateMode = state.settings?.importExport?.duplicateHandling || "";
    if (String(duplicateMode).includes("שמירת")) {
      return [...(currentFunds || []), ...(nextFunds || [])];
    }
    if (String(duplicateMode).includes("החלפת")) {
      return (nextFunds || []).slice();
    }
    const map = new Map();
    (currentFunds || []).forEach((fund) => {
      map.set(getFundMergeKey(fund), {
        ...fund,
        periodRows: (fund.periodRows || []).slice(),
        beneficiaries: (fund.beneficiaries || []).slice(),
        employers: (fund.employers || []).slice(),
        depositRows: (fund.depositRows || []).slice()
      });
    });
    (nextFunds || []).forEach((fund) => {
      const key = getFundMergeKey(fund);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, fund);
        return;
      }
      const current = map.get(key);
      map.set(key, {
        ...current,
        ...Object.fromEntries(Object.entries(fund).filter(([, value]) => {
          if (value === undefined || value === null || value === "") return false;
          if (typeof value === "number" && !Number.isFinite(value)) return false;
          return true;
        })),
        id: current.id || fund.id,
        recommendation: current.recommendation || fund.recommendation || "",
        notes: current.notes || fund.notes || "",
        periodRows: mergeCollectionByKey(
          current.periodRows,
          fund.periodRows,
          (row) => [
            normalizeText(row.periodLabel),
            normalizeText(row.componentLabel),
            normalizeText(row.balanceTypeLabel),
            row.amount || 0
          ].join("|")
        ),
        beneficiaries: mergeCollectionByKey(
          current.beneficiaries,
          fund.beneficiaries,
          (row) => [
            normalizeText(row.name),
            normalizeText(row.trackName),
            normalizeText(row.relation),
            row.share || 0
          ].join("|")
        ),
        employers: mergeCollectionByKey(
          current.employers,
          fund.employers,
          (row) => [
            normalizeText(row.idNumber),
            normalizeText(row.name)
          ].join("|")
        ),
        depositRows: mergeCollectionByKey(
          current.depositRows,
          fund.depositRows,
          (row) => [
            normalizeText(row.employerName),
            normalizeText(row.month),
            row.employeeContribution || 0,
            row.employerContribution || 0,
            row.compensation || 0
          ].join("|")
        )
      });
    });
    return Array.from(map.values());
  }

export function mergeInsurancePolicies(currentPolicies, nextPolicies) {
    const duplicateMode = state.settings?.importExport?.duplicateHandling || "";
    if (String(duplicateMode).includes("שמירת")) {
      return [...(currentPolicies || []), ...(nextPolicies || [])];
    }
    if (String(duplicateMode).includes("החלפת")) {
      return (nextPolicies || []).slice();
    }
    const map = new Map();
    [...(currentPolicies || []), ...(nextPolicies || [])].forEach((policy) => {
      const key = [
        policy.source,
        normalizeText(policy.manufacturer),
        normalizeText(policy.policyNumber),
        normalizeText(policy.planName),
        normalizeText(policy.secondaryBranch),
        normalizeText(policy.periodText)
      ].join("|");
      if (!map.has(key)) {
        map.set(key, policy);
      }
    });
    return Array.from(map.values());
  }

export function mergeClientRecords(baseClient, incomingClient) {
    if (!baseClient) return incomingClient || null;
    if (!incomingClient) return baseClient;
    return {
      ...baseClient,
      ...Object.fromEntries(Object.entries(incomingClient).filter(([, value]) => value !== undefined && value !== null && value !== ""))
    };
  }

export function getFundMergeKey(fund) {
    if (!fund) return "";
    const account = normalizeAccount(fund.accountNumber || fund.policyNumber || "");
    const fallbackIdentity = [
      normalizeText(fund.planName || fund.productName),
      normalizeText(fund.investmentTrack || fund.retirementTrackName),
      Math.round(Number(fund.currentBalance || 0)),
      Math.round(Number(fund.retirementCapital || 0))
    ].join(":");
    return [
      normalizeText(fund.manufacturer),
      account || fallbackIdentity || normalizeAccount(fund.id),
      normalizeText(fund.productType),
      normalizeText(fund.planName || fund.productName)
    ].join("|");
  }

export function normalizeFundManufacturers(funds) {
    return (Array.isArray(funds) ? funds : []).map((fund) => {
      if (!fund) return fund;
      const inferred = inferManufacturerFromText([
        fund.productName,
        fund.planName,
        fund.investmentTrack,
        fund.retirementTrackName,
        fund.manufacturer
      ].filter(Boolean).join(" "));
      if (!inferred || normalizeComparable(inferred) === normalizeComparable(fund.manufacturer || "")) {
        return fund;
      }
      return { ...fund, manufacturer: inferred };
    });
  }

export function assertSameClientUpload(nextClient) {
    if (!nextClient || !state.client) return;
    const currentId = normalizeDigits(state.client.idNumber);
    const nextId = normalizeDigits(nextClient.idNumber);
    if (currentId && nextId && currentId !== nextId) {
      throw new Error("לא ניתן להעלות קבצים של לקוחות שונים");
    }
    if (!shouldMergeClientAgainstBase(state.client, nextClient)) {
      throw new Error("לא ניתן להעלות קבצים של לקוחות שונים");
    }
  }

export function buildBeneficiarySchedule(monthlyPension) {
    const planningYears = Math.max(1, state.calc.planningYears || 20);
    const rows = [];
    let remainingMonths = Math.max(0, Math.round(state.calc.guaranteeMonths || 0));
    const spouseMonthly = monthlyPension * state.calc.spouseShare;
    const yearsToRender = state.calc.spouseShare > 0 ? planningYears : Math.max(planningYears, Math.ceil(remainingMonths / 12) || 1);

    for (let year = 1; year <= yearsToRender; year += 1) {
      const guaranteedAnnual = Math.min(12, remainingMonths) * monthlyPension;
      const exposure = state.calc.spouseShare > 0
        ? spouseMonthly * 12 * Math.max(1, yearsToRender - year + 1)
        : remainingMonths * monthlyPension;
      rows.push({
        year,
        remainingStart: remainingMonths,
        memberMonthly: monthlyPension,
        spouseMonthly,
        guaranteedAnnual,
        exposure,
        remainingEnd: Math.max(0, remainingMonths - 12)
      });
      remainingMonths = Math.max(0, remainingMonths - 12);
    }
    return rows;
  }

export function getSelectedBeneficiaries() {
    const byName = new Map();
    getSelectedFunds().forEach((fund) => {
      fund.beneficiaries.forEach((beneficiary) => {
        const key = `${beneficiary.name}::${beneficiary.relationship}`;
        const existing = byName.get(key) || { name: beneficiary.name, relationship: beneficiary.relationship, share: 0, accounts: [] };
        existing.share += beneficiary.share;
        existing.accounts.push(fund.accountNumber);
        byName.set(key, existing);
      });
    });
    return Array.from(byName.values()).map((item) => ({ ...item, share: Math.min(item.share, 100) }));
  }

export function buildBeneficiaryComparisonRows() {
    const groups = new Map();
    getSelectedFunds().forEach((fund) => {
      const label = getBeneficiaryPolicyLabel(fund);
      const collection = groups.get(label) || [];
      collection.push(fund);
      groups.set(label, collection);
    });

    return Array.from(groups.entries())
      .map(([label, funds]) => {
        const capital = sumBy(funds, (fund) => getFundCapital(fund));
        const baseFactor = getWeightedBaseFactor(funds, state.calc.fallbackFactor);
        const tracks = BENEFICIARY_MATRIX_TRACKS.map((matrixTrack) => {
          const config = getTrackConfig(matrixTrack.id);
          const coefficient = getTrackCoefficient(matrixTrack.id, baseFactor);
          const pension = coefficient > 0 ? capital / coefficient : 0;
          return {
            ...matrixTrack,
            coefficient,
            pension,
            spousePension: pension * config.spouseShare
          };
        });
        return { label, capital, tracks };
      })
      .sort((left, right) => compareText(left.label, right.label));
  }

export function getSimulationCapital(manualCapital) {
    const manual = toNumber(manualCapital);
    if (manual > 0) return manual;
    return sumBy(getSelectedFunds(), (fund) => getFundCapital(fund));
  }

export function getFundCapital(fund) {
    return firstPositive(fund.retirementCapital, fund.currentBalance, 0);
  }

export function getFundBaseFactor(fund, fallback) {
    return firstPositive(
      fund.guaranteedCoefficient,
      fund.importedPension > 0 && getFundCapital(fund) > 0 ? getFundCapital(fund) / fund.importedPension : NaN,
      fallback,
      0
    );
  }

export function getWeightedBaseFactor(funds, fallback) {
    const valid = funds.filter((fund) => getFundCapital(fund) > 0);
    if (!valid.length) return fallback;
    const totalCapital = sumBy(valid, (fund) => getFundCapital(fund));
    const totalPension = sumBy(valid, (fund) => {
      const factor = getFundBaseFactor(fund, fallback);
      return factor > 0 ? getFundCapital(fund) / factor : 0;
    });
    if (totalCapital <= 0 || totalPension <= 0) return fallback;
    return roundNumber(totalCapital / totalPension, 2);
  }

export function buildNeedsDefaults(funds) {
    const defaults = {
      incomeWorkPrimary: 0,
      incomeBituachPrimary: 0,
      incomePensionPrimary: sumBy(funds, (fund) => fund.importedPension),
      incomeRentPrimary: 0,
      incomeOtherPrimary: 0,
      incomeWorkSpouse: 0,
      incomeBituachSpouse: 0,
      incomePensionSpouse: 0,
      incomeRentSpouse: 0,
      incomeOtherSpouse: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      fixedNotes: "",
      variableNotes: "",
      assetBank: 0,
      assetPortfolio: 0,
      assetPolicies: sumBy(funds.filter((fund) => /פוליסה|מנהלים|ביטוח/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetProvident: sumBy(funds.filter((fund) => /גמל/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetStudyFunds: sumBy(funds.filter((fund) => /השתלמות/i.test(fund.productType || "")), (fund) => fund.currentBalance),
      assetInheritance: 0,
      assetRealEstate: 0,
      assetOther: 0,
      completed: false
    };
    return defaults;
  }

export function getNeedsTotals() {
    const primaryIncome = (state.needs.incomeWorkPrimary || 0)
      + (state.needs.incomeBituachPrimary || 0)
      + (state.needs.incomePensionPrimary || 0)
      + (state.needs.incomeRentPrimary || 0)
      + (state.needs.incomeOtherPrimary || 0);
    const spouseIncome = (state.needs.incomeWorkSpouse || 0)
      + (state.needs.incomeBituachSpouse || 0)
      + (state.needs.incomePensionSpouse || 0)
      + (state.needs.incomeRentSpouse || 0)
      + (state.needs.incomeOtherSpouse || 0);
    const totalIncome = primaryIncome + spouseIncome;
    const totalExpenses = (state.needs.fixedExpenses || 0) + (state.needs.variableExpenses || 0);
    const totalAssets = (state.needs.assetBank || 0)
      + (state.needs.assetPortfolio || 0)
      + (state.needs.assetPolicies || 0)
      + (state.needs.assetProvident || 0)
      + (state.needs.assetStudyFunds || 0)
      + (state.needs.assetInheritance || 0)
      + (state.needs.assetRealEstate || 0)
      + (state.needs.assetOther || 0);
    return {
      primaryIncome,
      spouseIncome,
      totalIncome,
      totalExpenses,
      totalAssets,
      balance: totalIncome - totalExpenses
    };
  }

export function sanitizeCompoundInput(raw) {
    return {
      initialAmount: clamp(toNumber(raw.initialAmount), 0, 100000000),
      monthlyDeposit: clamp(toNumber(raw.monthlyDeposit), 0, 1000000),
      annualReturn: clamp(toNumber(raw.annualReturn), -5, 30),
      years: clamp(Math.round(toNumber(raw.years)), 1, 50),
      annualFee: clamp(toNumber(raw.annualFee), 0, 10),
      depositFee: clamp(toNumber(raw.depositFee), 0, 6),
      inflation: clamp(toNumber(raw.inflation != null ? raw.inflation : 2), 0, 20),
      taxType: ["real", "nominal", "exempt"].includes(raw.taxType) ? raw.taxType : "real",
      linked: Boolean(raw.linked),
      scenario: ["conservative", "base", "optimistic"].includes(raw.scenario) ? raw.scenario : "base"
    };
  }

export function calculateCompoundProjection(input) {
    const data = sanitizeCompoundInput(input);
    const annualReturnWithScenario = data.annualReturn + getScenarioShift(data.scenario);

    // נוסחה נכונה: המרת ריבית שנתית לחודשית בדריבית (לא חלוקה פשוטה)
    const monthlyReturn = Math.pow(1 + annualReturnWithScenario / 100, 1 / 12) - 1;
    // דמי ניהול חודשיים בדריבית נכונה
    const monthlyBalanceFeeRate = data.annualFee > 0 ? (1 - Math.pow(1 - data.annualFee / 100, 1 / 12)) : 0;
    // הצמדה חודשית (2% שנתי)
    const monthlyIndex = data.linked ? (Math.pow(1.02, 1 / 12) - 1) : 0;
    // אינפלציה חודשית לחישוב ריאלי
    const monthlyInflation = data.inflation > 0 ? (Math.pow(1 + data.inflation / 100, 1 / 12) - 1) : 0;
    const depositFeeRate = data.depositFee / 100;
    const totalMonths = data.years * 12;

    let grossBalance = data.initialAmount;
    let netBalance = data.initialAmount;
    let grossDeposits = data.initialAmount;
    let netDeposits = data.initialAmount;
    let totalBalanceFees = 0;
    let totalDepositFees = 0;
    let cumulativeInflationFactor = 1;
    const annualRows = [];

    for (let month = 1; month <= totalMonths; month += 1) {
      const indexedFactor = Math.pow(1 + monthlyIndex, month - 1);
      const rawDeposit = data.monthlyDeposit * indexedFactor;
      const depositFeeAmount = rawDeposit * depositFeeRate;
      const netMonthlyDeposit = rawDeposit - depositFeeAmount;

      grossDeposits += rawDeposit;
      netDeposits += netMonthlyDeposit;
      totalDepositFees += depositFeeAmount;

      // END of period — ordinary annuity (תואם CMPD SET=END)
      grossBalance *= (1 + monthlyReturn);
      grossBalance += rawDeposit;

      netBalance *= (1 + monthlyReturn);
      const balanceFeeForMonth = netBalance * monthlyBalanceFeeRate;
      totalBalanceFees += balanceFeeForMonth;
      netBalance -= balanceFeeForMonth;
      netBalance += netMonthlyDeposit;

      cumulativeInflationFactor *= (1 + monthlyInflation);

      if (month % 12 === 0) {
        const realBalance = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance;
        const nominalGain = netBalance - netDeposits;
        const inflationAdjustedInvested = netDeposits * cumulativeInflationFactor;
        const realGain = netBalance - inflationAdjustedInvested;
        let taxAmount = 0;
        if (data.taxType === "nominal") taxAmount = Math.max(0, nominalGain) * 0.25;
        else if (data.taxType === "real") taxAmount = Math.max(0, realGain) * 0.25;

        annualRows.push({
          year: month / 12,
          grossBalance,
          netBalance,
          realBalance,
          afterTax: netBalance - taxAmount,
          grossDeposits,
          netDeposits,
          balanceFees: totalBalanceFees,
          depositFees: totalDepositFees,
          totalFees: totalBalanceFees + totalDepositFees,
          nominalGain,
          taxAmount
        });
      }
    }

    // חישוב ריאלי ומס לסיום
    const realFinal = cumulativeInflationFactor > 0 ? netBalance / cumulativeInflationFactor : netBalance;
    const finalNominalGain = netBalance - netDeposits;
    const finalInflationAdjustedInvested = netDeposits * cumulativeInflationFactor;
    const finalRealGain = netBalance - finalInflationAdjustedInvested;
    let taxFinal = 0;
    if (data.taxType === "nominal") taxFinal = Math.max(0, finalNominalGain) * 0.25;
    else if (data.taxType === "real") taxFinal = Math.max(0, finalRealGain) * 0.25;
    const afterTaxFinal = netBalance - taxFinal;

    return {
      inputs: data,
      annualReturnWithScenario,
      effectiveMonthlyReturn: monthlyReturn,
      grossFinal: grossBalance,
      netFinal: netBalance,
      realFinal,
      afterTaxFinal,
      taxFinal,
      grossDeposits,
      netDeposits,
      deposits: grossDeposits,
      profits: netBalance - netDeposits,
      grossProfits: grossBalance - grossDeposits,
      totalBalanceFees,
      totalDepositFees,
      feeImpact: grossBalance - netBalance,
      annualRows
    };
  }

export function buildSimulationScenarioComparison(baseInput) {
    const baseline = sanitizeCompoundInput(baseInput);
    const scenarios = [
      { id: "conservative", label: "שמרני" },
      { id: "base", label: "בסיס" },
      { id: "optimistic", label: "אופטימי" }
    ];
    const rows = scenarios.map((scenario) => {
      const result = calculateCompoundProjection({ ...baseline, scenario: scenario.id });
      return {
        ...scenario,
        netFinal: result.netFinal,
        grossFinal: result.grossFinal,
        realFinal: result.realFinal,
        afterTaxFinal: result.afterTaxFinal
      };
    });
    const base = rows.find((row) => row.id === "base");
    return rows.map((row) => ({
      ...row,
      gapFromBase: base ? (row.netFinal - base.netFinal) : 0
    }));
  }

// TODO: remove DOM dependency
export function getAbdReturnsRows() {
    const uploadedRows = getPersistedAbdUploadedRows();
    const baseRows = Array.isArray(window.ABD_RETURNS_DATA)
      ? window.ABD_RETURNS_DATA
      : Array.isArray(globalThis.ABD_RETURNS_DATA)
        ? globalThis.ABD_RETURNS_DATA
        : [];
    return [...baseRows, ...uploadedRows];
  }

// TODO: remove DOM dependency
export function getPersistedAbdUploadedRows() {
    const currentRows = Array.isArray(state?.simulations?.abdReturns?.uploadedRows) ? state.simulations.abdReturns.uploadedRows : [];
    if (currentRows.length) return currentRows;
    try {
      const stored = JSON.parse(localStorage.getItem(ABD_RETURNS_UPLOAD_STORAGE_KEY) || "[]");
      if (Array.isArray(stored) && stored.length) {
        state.simulations.abdReturns.uploadedRows = stored;
        return stored;
      }
    } catch (error) {
      console.warn("[ABD-finance][abd returns upload]", error);
    }
    return currentRows;
  }

// TODO: remove DOM dependency
export function persistAbdUploadedRows() {
    try {
      localStorage.setItem(ABD_RETURNS_UPLOAD_STORAGE_KEY, JSON.stringify(state.simulations.abdReturns.uploadedRows || []));
    } catch (error) {
      console.warn("[ABD-finance][abd returns upload save]", error);
    }
  }

export function normalizeProductType(productType) {
    const text = normalizeText(productType);
    if (!text) return "";
    if (text.includes("חיסכון לכל ילד") || text.includes("חסכון לכל ילד") || text.includes("ילד")) return "חיסכון לכל ילד";
    if (text.includes("השתלמות")) return "קרן השתלמות";
    if (text.includes("פנסיה")) return "קרן פנסיה";
    if (text.includes("גמל") && text.includes("השקעה")) return "קופת גמל להשקעה";
    if (text.includes("גמל") || text.includes("תגמולים") || text.includes("פיצויים")) return "קופת גמל";
    if (text.includes("פוליסה") || text.includes("מנהלים") || text.includes("פיננס")) return "פוליסה פיננסית";
    return String(productType || "").trim();
  }

export function normalizeManufacturerName(manufacturer) {
    const rawText = normalizeText(manufacturer);
    const text = rawText
      .replace(/בעמ|בע מ|חברה|ניהול|קופות|גמל|פנסיה|ביטוח|ופיננסים|פיננסים|מבטחים|השקעות/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const aliases = [
      ["מיטב", ["מיטב", "דש"]],
      ["הראל", ["הראל"]],
      ["כלל", ["כלל"]],
      ["מגדל", ["מגדל"]],
      ["מנורה מבטחים", ["מנורה", "מבטחים"]],
      ["הפניקס", ["הפניקס", "פניקס"]],
      ["אלטשולר שחם", ["אלטשולר", "שחם"]],
      ["ילין לפידות", ["ילין", "לפידות"]],
      ["מור", ["מור"]],
      ["אנליסט", ["אנליסט"]],
      ["איילון", ["איילון"]],
      ["הכשרה", ["הכשרה"]],
      ["אינפיניטי", ["אינפיניטי"]],
      ["פסגות", ["פסגות"]]
    ];
    const hit = aliases.find(([label, words]) => words.some((word) => text.includes(normalizeText(word)) || rawText.includes(normalizeText(word))));
    return hit ? hit[0] : String(manufacturer || "").trim();
  }

export function normalizeTrackName(trackName) {
    return normalizeText(trackName)
      .replace(/מסלול|השקעה|בעמ|בע מ/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

export function getManufacturersByProductType(productType) {
    const normalizedType = normalizeProductType(productType);
    const rows = getAbdReturnsRows().filter((row) => !normalizedType || normalizeProductType(row.productType) === normalizedType);
    return uniqueValues(rows.map((row) => normalizeManufacturerName(row.manufacturer)).filter(Boolean)).sort((a, b) => a.localeCompare(b, "he"));
  }

export function getTracksByProductAndManufacturer(productType, manufacturer) {
    const normalizedType = normalizeProductType(productType);
    const normalizedManufacturer = normalizeManufacturerName(manufacturer);
    return getAbdReturnsRows()
      .filter((row) => !normalizedType || normalizeProductType(row.productType) === normalizedType)
      .filter((row) => !normalizedManufacturer || normalizeManufacturerName(row.manufacturer) === normalizedManufacturer)
      .filter((row) => normalizedManufacturer !== "כלל" || /^כלל(?:\s|-|$)/.test(String(row.trackName || "").trim()))
      .sort((a, b) => String(a.trackName || "").localeCompare(String(b.trackName || ""), "he"));
  }

export function getTrackDetails(trackId) {
    return getAbdReturnsRows().find((row) => String(row.id) === String(trackId) || String(row.trackId || "") === String(trackId || "")) || null;
  }

export function getAbdReturnMetric(row, key) {
    const mode = getAbdReturnMode();
    if (key === "periodAvg") return row?.returns?.periodAvg;
    if (key === "periodAccumulated") return row?.returns?.periodAccumulated;
    if (key === "annual3") return mode === "cumulative"
      ? firstFiniteReturn(row?.returns?.months36Accumulated, row?.returns?.annual3)
      : firstFiniteReturn(row?.returns?.annual3, row?.returns?.months36Accumulated);
    if (key === "annual5") return mode === "cumulative"
      ? firstFiniteReturn(row?.returns?.months60Accumulated, row?.returns?.annual5)
      : firstFiniteReturn(row?.returns?.annual5, row?.returns?.months60Accumulated);
    if (key === "sharpe") return row?.risk?.sharpe;
    if (key === "assets") return row?.assets;
    return undefined;
  }

export function firstFiniteReturn(primary, fallback) {
    const primaryNumber = Number(primary);
    const fallbackNumber = Number(fallback);
    if (Number.isFinite(primaryNumber) && (primaryNumber !== 0 || !Number.isFinite(fallbackNumber) || fallbackNumber === 0)) return primaryNumber;
    if (Number.isFinite(fallbackNumber)) return fallbackNumber;
    return Number.isFinite(primaryNumber) ? primaryNumber : NaN;
  }

export function getAbdReturnClass(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "";
    return numeric >= 0 ? "pos" : "neg";
  }

export function sortAbdRows(rows, sortState) {
    return [...rows].sort((a, b) => {
      const av = getAbdSortValue(a, sortState.col);
      const bv = getAbdSortValue(b, sortState.col);
      if (av === -999999 && bv === -999999) return 0;
      if (av === -999999) return 1;
      if (bv === -999999) return -1;
      return sortState.dir === "desc" ? bv - av : av - bv;
    });
  }

export function averageAbdRows(rows, selector) {
    const values = rows.map(selector).map(Number).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
  }

// TODO: remove DOM dependency
export function loadAbdReturnsHighlights() {
    try {
      const stored = localStorage.getItem(getSettingsHighlightStorageKey());
      abdReturnsHighlights = stored ? JSON.parse(stored) || {} : {};
    } catch (error) {
      abdReturnsHighlights = {};
    }
    return abdReturnsHighlights;
  }

// TODO: remove DOM dependency
export function saveAbdReturnsHighlights() {
    try {
      localStorage.setItem(getSettingsHighlightStorageKey(), JSON.stringify(abdReturnsHighlights || {}));
    } catch (error) {
      // localStorage can be unavailable in private contexts.
    }
  }

// TODO: remove DOM dependency
export function parseAbdExcelWorkbook(workbook, fileName) {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(firstSheet, { raw: false, defval: "" });
    const generated = [];
    rows.forEach((row, index) => {
      const trackName = row.SHM_KUPA || row["שם קופה"] || row["שם מסלול"] || row["שם"] || "";
      if (!trackName || row.TAARICH_SIUM_PEILUT) return;
      const productType = row.SUG_KUPA || row["סוג מוצר"] || (String(fileName || "").includes("פנס") ? "קרן פנסיה" : "קופת גמל");
      const manufacturer = row.SHM_HEVRA_MENAHELET || row["חברה מנהלת"] || row["יצרן"] || row["שם חברה"] || trackName;
      generated.push(makeAbdUploadRow("upload", productType, manufacturer, trackName, row.ID || row.MISPAR_KUPA_AV || row["מספר קופה"] || index, {
        specialization: inferAbdSpecialization(trackName, row.HITMAHUT_MISHNIT || row.HITMAHUT_RASHIT || row["התמחות"]),
        reportPeriod: `${row.MI_TKUFAT_DIVUACH || ""}-${row.AD_TKUFAT_DIVUACH || ""}`,
        periodAvg: row.TSUA_MEMUZAAT_LETKUFA || row["ממוצע/חודש"],
        periodAccumulated: row.TSUA_MITZTABERET_LETKUFA || row["שנה"],
        months36Accumulated: row.TSUA_MITZTABERET_36_HODASHIM,
        months60Accumulated: row.TSUA_MITZTABERET_60_HODASHIM,
        annual3: row.TSUA_SHNATIT_MEMUZAAT_3_SHANIM || row["3 שנים"],
        annual5: row.TSUA_SHNATIT_MEMUZAAT_5_SHANIM || row["5 שנים"],
        stdev36: row.STIAT_TEKEN_36_HODASHIM,
        stdev60: row.STIAT_TEKEN_60_HODASHIM,
        alpha: row.ALPHA_SHNATIT,
        sharpe: row.SHARP_KOL_HAKUPOT || row.SHARP_ANAF || row["שארפ"],
        feeBalance: row.SHIUR_DMEI_NIHUL_AHARON,
        feeDeposit: row.SHIUR_D_NIHUL_AHARON_HAFKADOT,
        assets: row.YITRAT_NCHASIM_LSOF_TKUFA
      }));
    });
    return generated.filter((row) => row.trackName);
  }

// TODO: remove DOM dependency
export function parseAbdXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const nodes = Array.from(doc.querySelectorAll("ROW, Row"));
    const get = (node, tag) => node.querySelector(tag)?.textContent?.trim() || "";
    return nodes.map((node, index) => {
      const trackName = get(node, "SHM_KUPA") || get(node, "SHEM_GUF");
      if (!trackName || get(node, "TAARICH_SIUM_PEILUT")) return null;
      const productType = get(node, "SUG_KUPA") || "פוליסה פיננסית";
      return makeAbdUploadRow("upload-xml", productType, get(node, "SHM_HEVRA_MENAHELET") || trackName, trackName, get(node, "ID") || get(node, "ID_GUF") || index, {
        specialization: inferAbdSpecialization(trackName, get(node, "HITMAHUT_MISHNIT")),
        reportPeriod: `${get(node, "MI_TKUFAT_DIVUACH")}-${get(node, "AD_TKUFAT_DIVUACH")}`,
        periodAvg: get(node, "TSUA_MEMUZAAT_LETKUFA"),
        periodAccumulated: get(node, "TSUA_MITZTABERET_LETKUFA") || get(node, "TSUA_MITZ_LE_TKUFA"),
        months36Accumulated: get(node, "TSUA_MITZTABERET_36_HODASHIM"),
        months60Accumulated: get(node, "TSUA_MITZTABERET_60_HODASHIM"),
        annual3: get(node, "TSUA_SHNATIT_MEMUZAAT_3_SHANIM"),
        annual5: get(node, "TSUA_SHNATIT_MEMUZAAT_5_SHANIM"),
        stdev36: get(node, "STIAT_TEKEN_36_HODASHIM"),
        stdev60: get(node, "STIAT_TEKEN_60_HODASHIM"),
        alpha: get(node, "ALPHA_SHNATI") || get(node, "ALPHA_SHNATIT"),
        sharpe: get(node, "SHARP_RIBIT_HASRAT_SIKUN") || get(node, "SHARP_TSUA_HEZYONIT_ANAF"),
        feeBalance: get(node, "SHIUR_D_NIHUL_NECHASIM"),
        feeDeposit: get(node, "SHIUR_D_NIHUL_HAFKADOT"),
        assets: get(node, "YIT_NCHASIM_BFOAL")
      });
    }).filter(Boolean);
  }

// TODO: remove DOM dependency
export async function handleAbdReturnsFiles(files) {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    const status = [];
    const uploadedRows = [];
    for (const file of selectedFiles) {
      try {
        if (file.name.toLowerCase().endsWith(".xml")) {
          const xmlText = await file.text();
          const rows = parseAbdXml(xmlText);
          uploadedRows.push(...rows);
          status.push(`${file.name}: ${rows.length} מסלולים נטענו`);
        } else {
          await ensureXLSX();
          const buffer = await file.arrayBuffer();
          const workbook = window.XLSX.read(buffer, { type: "array" });
          const rows = parseAbdExcelWorkbook(workbook, file.name);
          uploadedRows.push(...rows);
          status.push(`${file.name}: ${rows.length} מסלולים נטענו`);
        }
      } catch (error) {
        status.push(`${file.name}: שגיאה בטעינה - ${error.message}`);
      }
    }
    state.simulations.abdReturns.uploadedRows = uploadedRows;
    state.simulations.abdReturns.uploadStatus = status;
    persistAbdUploadedRows();
    renderSimulationsTab();
  }

export function findAbdReturnsMatchForFund(fund) {
    const rows = getAbdReturnsRows();
    if (!fund || !rows.length) return null;
    const productType = normalizeProductType(fund.productType || fund.productName || fund.planName);
    const manufacturer = normalizeManufacturerName(fund.manufacturer);
    const trackNumber = String(fund.trackNumber || fund.investmentTrackNumber || "").trim();
    const trackText = normalizeTrackName([fund.investmentTrack, fund.retirementTrackName, fund.planName, fund.productName].filter(Boolean).join(" "));
    const candidates = rows.filter((row) => {
      if (productType && normalizeProductType(row.productType) !== productType) return false;
      if (manufacturer && normalizeManufacturerName(row.manufacturer) !== manufacturer) return false;
      return true;
    });
    let best = null;
    let bestScore = 0;
    candidates.forEach((row) => {
      let score = 0;
      const rowTrack = normalizeTrackName(row.trackName);
      if (trackNumber && String(row.trackId || "").trim() === trackNumber) score += 100;
      if (trackText && rowTrack && (rowTrack.includes(trackText) || trackText.includes(rowTrack))) score += 40;
      if (trackText && row.specialization && normalizeTrackName(row.specialization) && trackText.includes(normalizeTrackName(row.specialization))) score += 12;
      if (!trackText && rowTrack) score += 1;
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    });
    return bestScore > 0 ? best : null;
  }

export function getSimulationReturnsRows() {
    return state.funds.map((fund) => {
      const abdMatch = findAbdReturnsMatchForFund(fund);
      const returnsData = state.smartAnalysis.returnsByFundId[fund.id] || null;
      const returns = abdMatch?.returns || (returnsData && returnsData.returns) || null;
      return {
        id: fund.id,
        productType: fund.productType || "אין נתון",
        manufacturer: fund.manufacturer || "אין נתון",
        fundName: fund.planName || fund.productName || "אין נתון",
        trackName: fund.investmentTrack || fund.retirementTrackName || abdMatch?.trackName || "אין נתון",
        trackNumber: abdMatch?.trackId || (returnsData && returnsData.trackNumber) || "אין נתון",
        tMonth: Number.isFinite(Number(returns?.periodAvg)) ? Number(returns.periodAvg) : Number.isFinite(returns?.monthly) ? returns.monthly : NaN,
        tYtd: Number.isFinite(returns?.ytd) ? returns.ytd : NaN,
        t12: Number.isFinite(Number(returns?.periodAccumulated)) ? Number(returns.periodAccumulated) : Number.isFinite(returns?.trailing12m) ? returns.trailing12m : NaN,
        t36: Number.isFinite(Number(returns?.annual3)) ? Number(returns.annual3) : Number.isFinite(returns?.trailing36m) ? returns.trailing36m : NaN,
        t60: Number.isFinite(Number(returns?.annual5)) ? Number(returns.annual5) : Number.isFinite(returns?.trailing60m) ? returns.trailing60m : NaN,
        fee: fund.managementFeeText || (Number.isFinite(Number(abdMatch?.fees?.balance)) ? `${fmtNumber(abdMatch.fees.balance, 2)}%` : "אין נתון"),
        lastUpdated: abdMatch?.reportPeriod || (returnsData && returnsData.lastUpdated) || "אין נתון",
        source: abdMatch ? "ABD RETURNS" : (returnsData && returnsData.source ? returnsData.source : "לא נמצאה התאמה במאגר התשואות")
      };
    });
  }

export function buildMeetingSummaryDefaults() {
    const clientName = state.client && state.client.fullName ? state.client.fullName : "לקוח";
    const idNumber = state.client && state.client.idNumber ? ` ת.ז ${state.client.idNumber}` : "";
    return {
      documentDate: formatDateForInput(new Date()),
      adviceType: "pension",
      brandName: state.settings?.display?.companyName || "ABD-finance",
      documentTitle: "הנדון: תכנון פנסיוני - מסמך מרכז",
      clientLine: `עבור ${clientName}${idNumber}`,
      introText: getMeetingSummaryDefaultIntro(),
      showFundsSummaryTable: isMeetingSectionEnabled("facts"),
      showNeedsSection: isMeetingSectionEnabled("facts"),
      showFactsTable: isMeetingSectionEnabled("facts"),
      showPensionSnapshotTable: isMeetingSectionEnabled("infrastructure"),
      showInfrastructureTable: isMeetingSectionEnabled("infrastructure"),
      showMigrationTable: isMeetingSectionEnabled("recommendations"),
      facts: buildMeetingSummaryFacts(),
      recommendations: buildMeetingSummaryRecommendations(),
      manualFollowUps: [],
      hiddenAutoFacts: [],
      hiddenAutoFollowUps: [],
      recommendationsAuto: true,
      screenshots: []
    };
  }

export function buildMeetingSummaryFacts() {
    const selectedFunds = getSelectedFunds();
    const needsTotals = getNeedsTotals();
    const pensionResult = buildTrackResult(state.calc.activeTrack);
    const selectedInsurancePolicies = getSelectedInsurancePolicies();
    return [
      { id: "auto-fact-client-name", isAuto: true, label: "שם הלקוח", value: state.client && state.client.fullName ? state.client.fullName : "—" },
      { id: "auto-fact-client-id", isAuto: true, label: "תעודת זהות", value: state.client && state.client.idNumber ? state.client.idNumber : "—" },
      { id: "auto-fact-funds-count", isAuto: true, label: "מספר קופות בדוח", value: String(state.funds.length) },
      { id: "auto-fact-insurance-count", isAuto: true, label: "מספר פוליסות ביטוח", value: String(state.insurancePolicies.length) },
      { id: "auto-fact-selected-insurance-count", isAuto: true, label: "פוליסות שנבחרו לסיכום", value: String(selectedInsurancePolicies.length) },
      { id: "auto-fact-selected-funds-count", isAuto: true, label: "קופות שסומנו לחישוב", value: String(selectedFunds.length) },
      { id: "auto-fact-pension-capital", isAuto: true, label: "הון לקצבה", value: pensionResult.capital > 0 ? fmtCurrency(pensionResult.capital) : "טרם נבחרו קופות" },
      { id: "auto-fact-estimated-pension", isAuto: true, label: "קצבה משוערת", value: pensionResult.monthlyPension > 0 ? fmtCurrency(pensionResult.monthlyPension) : "טרם חושב" },
      { id: "auto-fact-guarantee-track", isAuto: true, label: "מסלול הבטחה גלובלי", value: describeMeetingGuaranteeTrack() },
      { id: "auto-fact-needs-balance", isAuto: true, label: "מאזן חודשי מבירור צרכים", value: fmtCurrency(needsTotals.balance) }
    ];
  }

export function buildMeetingSummaryRecommendations() {
    const fundRecommendations = getFundsWithMeetingRecommendations()
      .map((fund) => {
        const text = buildFundMeetingRecommendationText(fund);
        return text ? {
          id: createClientSideId("recommendation"),
          sourceFundId: fund.id,
          text
        } : null;
      })
      .filter(Boolean);
    return [...fundRecommendations, ...buildActionMeetingRecommendations()];
  }

export function buildActionMeetingRecommendations() {
    const transactionItems = (state.actions?.transactions || []).map((action) => ({
      id: `action-rec-${action.id}`,
      text: describeTransactionAction(action)
    })).filter((item) => hasMeaningfulText(item.text));
    const riskItems = (state.actions?.risks || []).map((action) => ({
      id: `risk-rec-${action.id}`,
      text: describeRiskAction(action)
    })).filter((item) => hasMeaningfulText(item.text));
    return [...transactionItems, ...riskItems];
  }

export function buildMeetingSummaryFollowUps() {
    const selectedFunds = getSelectedFunds();
    const hiddenAuto = new Set((state.meetingSummary.hiddenAutoFollowUps || []).map((item) => normalizeMeetingText(item)).filter(Boolean));
    const entries = [];
    const seen = new Set();

    (state.meetingSummary.manualFollowUps || []).forEach((item) => {
      const text = normalizeMeetingText(item.text);
      if (!text || seen.has(text)) return;
      seen.add(text);
      entries.push({
        id: item.id || createClientSideId("followup"),
        text,
        isAuto: false
      });
    });

    selectedFunds.forEach((fund) => {
      [fund.notes]
        .map((value) => normalizeMeetingText(value))
        .filter(Boolean)
        .forEach((value) => {
          if (!seen.has(value) && !hiddenAuto.has(value)) {
            seen.add(value);
            entries.push({
              id: `auto-followup-${entries.length + 1}`,
              text: value,
              isAuto: true,
              sourceText: value
            });
          }
        });
    });
    const screenshotsFollowUp = "לסיכום צורפו צילומי מסך ומסמכים תומכים להמשך הטיפול.";
    if (state.meetingSummary.screenshots.some((item) => item.imageData) && !seen.has(screenshotsFollowUp) && !hiddenAuto.has(screenshotsFollowUp)) {
      entries.push({
        id: `auto-followup-${entries.length + 1}`,
        text: screenshotsFollowUp,
        isAuto: true,
        sourceText: screenshotsFollowUp
      });
    }
    return entries.slice(0, 8);
  }

export function buildFundMeetingRecommendationText(fund) {
    const recommendationText = normalizeMeetingText(fund.recommendation);

    if (!recommendationText) {
      return "";
    }

    const migrationText = buildFundMigrationSummaryText(fund);
    return `${describeFundForMeeting(fund)}: ${recommendationText}${migrationText ? ` ${migrationText}` : ""}`;
  }

export function buildFundMigrationSummaryText(fund) {
    if (!isFundMigrationActive(fund)) {
      return "";
    }
    const plan = fund.migrationPlan || {};
    if (!plan.targetProduct && !plan.targetCompany && !plan.investmentTrack && !plan.reason && !plan.professionalNotes) {
      return "";
    }
    const parts = [];
    if (plan.targetProduct) parts.push(`מוצר יעד: ${plan.targetProduct}`);
    if (plan.targetCompany) parts.push(`יצרן יעד: ${plan.targetCompany}`);
    if (plan.investmentTrack) parts.push(`מסלול: ${formatAbdTrackForSummary(plan, "investment")}`);
    if (hasMeaningfulText(plan.managementFeeBalance)) parts.push(`דמי ניהול מצבירה: ${plan.managementFeeBalance}%`);
    if (hasMeaningfulText(plan.managementFeeDeposit)) parts.push(`דמי ניהול מהפקדה: ${plan.managementFeeDeposit}%`);
    if (hasMeaningfulText(plan.reason)) parts.push(`סיבת ההמלצה: ${plan.reason}`);
    if (hasMeaningfulText(plan.professionalNotes)) parts.push(`הערות מקצועיות: ${plan.professionalNotes}`);
    return parts.length ? `פרטי הניוד: ${parts.join(" | ")}.` : "";
  }
