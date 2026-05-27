/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import * as XLSX from "xlsx";

export async function exportTrackingWorkbook() {
    const dealRows = buildTrackingDealsRows();
    const riskRows = buildTrackingRisksRows();
    if (!dealRows.length && !riskRows.length) {
      showToast("אין פעולות לייצוא למעקב.");
      return;
    }
    try {
      await ensureXLSX();
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([TRACKING_DEALS_HEADERS, ...dealRows]), "עסקאות");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([TRACKING_RISKS_HEADERS, ...riskRows]), "סיכונים");
      const clientName = sanitizeFileName(state.client?.fullName || "לקוח");
      XLSX.writeFile(workbook, `מעקב_${clientName}_${formatDateForInput(new Date())}.xlsx`);
      showToast("קובץ המעקב נוצר בהצלחה.");
    } catch (error) {
      console.error("[ABD-finance][exportTrackingWorkbook]", error);
      showToast("לא ניתן ליצור קובץ מעקב כרגע.");
    }
  }

export async function exportTrackingSettingsTrialWorkbook() {
    try {
      await ensureXLSX();
      const columns = getTrackingExcelColumns().filter((column) => column.enabled);
      if (!columns.length) {
        showToast("בחר לפחות עמודה אחת לייצוא.", true);
        return;
      }
      const rows = buildTrackingPreviewRows();
      const aoa = [columns.map((column) => column.label), ...rows.map((row) => columns.map((column) => row[column.id] || ""))];
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      worksheet["!cols"] = columns.map((column) => ({ wch: Number(column.width) || 16 }));
      worksheet["!freeze"] = state.settings.trackingExcel.freezeHeader ? { xSplit: 0, ySplit: 1 } : undefined;
      worksheet["!dir"] = state.settings.trackingExcel.rtl ? "rtl" : "ltr";
      const workbook = XLSX.utils.book_new();
      workbook.Workbook = { Views: [{ RTL: Boolean(state.settings.trackingExcel.rtl) }] };
      XLSX.utils.book_append_sheet(workbook, worksheet, "תיעוד");
      XLSX.writeFile(workbook, `ABD_tracking_trial_${formatDateForInput(new Date())}.xlsx`);
      commitSettingsSave("קובץ ניסיון נוצר לפי הגדרות הייצוא.");
    } catch (error) {
      console.error("[ABD-finance][settings export]", error);
      showToast("לא ניתן ליצור כרגע קובץ ניסיון.", true);
    }
  }

// TODO: remove DOM dependency
export function exportSimulationsReturnsCsv() {
    const rows = getSimulationReturnsRows();
    const csvRows = [
      ["שם קופה", "יצרן", "סוג מוצר", "מספר מסלול", "חודש", "מתחילת שנה", "12 חודשים", "36 חודשים", "60 חודשים", "מקור", "עדכון"].join(","),
      ...rows.map((row) => [
        row.fundName,
        row.manufacturer,
        row.productType,
        row.trackNumber,
        Number.isFinite(row.tMonth) ? row.tMonth : "",
        Number.isFinite(row.tYtd) ? row.tYtd : "",
        Number.isFinite(row.t12) ? row.t12 : "",
        Number.isFinite(row.t36) ? row.t36 : "",
        Number.isFinite(row.t60) ? row.t60 : "",
        row.source,
        row.lastUpdated
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `simulations-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("ייצוא CSV הושלם.");
  }

// TODO: remove DOM dependency
export function printSimulationsReturns() {
    const rows = getSimulationReturnsRows();
    const html = `
      <!doctype html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>טבלאות תשואות קופות</title>
        <style>
          body{font-family:Heebo,Arial,sans-serif;margin:18px;color:#244a73}
          h1{margin:0 0 10px;font-size:24px}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #cfe2f3;padding:7px 8px;font-size:12px;text-align:right}
          th{background:#eef6fd}
        </style>
      </head>
      <body>
        <h1>טבלאות תשואות קופות</h1>
        <table>
          <thead><tr><th>קופה</th><th>יצרן</th><th>סוג מוצר</th><th>מסלול</th><th>12ח'</th><th>36ח'</th><th>60ח'</th><th>מקור</th></tr></thead>
          <tbody>
            ${rows.map((row) => `<tr><td>${escapeHtml(row.fundName)}</td><td>${escapeHtml(row.manufacturer)}</td><td>${escapeHtml(row.productType)}</td><td>${escapeHtml(row.trackNumber)}</td><td>${Number.isFinite(row.t12) ? `${fmtNumber(row.t12, 2)}%` : "אין נתון"}</td><td>${Number.isFinite(row.t36) ? `${fmtNumber(row.t36, 2)}%` : "אין נתון"}</td><td>${Number.isFinite(row.t60) ? `${fmtNumber(row.t60, 2)}%` : "אין נתון"}</td><td>${escapeHtml(row.source)}</td></tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>`;
    const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=760");
    if (!popup) {
      showToast("לא ניתן לפתוח חלון הדפסה.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 220);
  }

// TODO: remove DOM dependency
export function printMeetingSummary() {
    const previewHtml = renderMeetingSummaryPreview();
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      showToast("הדפדפן חסם פתיחת חלון הדפסה", true);
      return;
    }
    printWindow.document.write(`
      <!doctype html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>סיכום פגישה</title>
        <style>
          body { margin: 0; background: #f3efe6; font-family: "Heebo", "Segoe UI", Arial, sans-serif; }
          .summary-paper { width: min(100%, 920px); margin: 18px auto; padding: 26px 28px 30px; border-radius: 22px; background: #fff; color: #22314a; box-shadow: 0 30px 70px rgba(37,32,24,0.12); border: 1px solid rgba(186,143,56,0.18); }
          .summary-paper-top { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: #5f6a7c; margin-bottom: 12px; }
          .summary-paper-brand { text-align: center; margin-bottom: 12px; }
          .summary-brand-logo { display:block; width:190px; max-height:76px; object-fit:contain; margin:0 auto 8px; }
          .summary-paper-brand strong { display: inline-block; padding-bottom: 6px; border-bottom: 2px solid rgba(186,143,56,0.32); font-size: 27px; color: #1e3f6f; font-weight: 800; }
          .summary-paper h1, .summary-paper h2, .summary-paper h3 { margin: 0; color: #1e3f6f; }
          .summary-paper h1 { text-align: center; font-size: 27px; margin-bottom: 6px; text-decoration: underline; }
          .summary-paper h2 { text-align: center; font-size: 21px; margin-bottom: 10px; }
          .summary-paper p, .summary-paper li { color: #2f3a4c; line-height: 1.48; }
          .summary-paper section + section { margin-top: 14px; }
          .summary-paper section { break-inside: auto; page-break-inside: auto; }
          .summary-paper-title { margin-bottom: 7px; border-bottom: 2px solid rgba(30,63,111,0.14); padding-bottom: 5px; }
          .summary-paper-title h3 { font-weight: 800; }
          .summary-preview-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
          .summary-preview-table th, .summary-preview-table td { border: 1px solid #d8dfeb; padding: 5px 6px; text-align: right; vertical-align: top; word-break: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.3; }
          .summary-preview-table th { background: #edf2fa; color: #1e3f6f; }
          .summary-preview-table tbody tr:nth-child(odd) td { background: #ffffff; }
          .summary-preview-table tbody tr:nth-child(even) td { background: #f1f9ff; }
          .summary-needs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
          .summary-needs-card { border: 1px solid rgba(186,143,56,0.22); border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #fffdf8 0%, #faf4e8 100%); }
          .summary-needs-card h4 { margin: 0; padding: 8px 10px; background: linear-gradient(180deg, #f6ead2 0%, #efdfbc 100%); color: #7d5d22; font-size: 14px; }
          .summary-needs-card table { width: 100%; border-collapse: collapse; }
          .summary-needs-list { display: grid; }
          .summary-needs-head, .summary-needs-item { display: grid; align-items: center; gap: 6px; padding: 6px 8px; font-size: 11px; border-top: 1px solid rgba(186,143,56,0.16); }
          .summary-needs-head { font-weight: 700; color: #7d5d22; background: rgba(246,234,210,0.42); }
          .summary-needs-head span, .summary-needs-item span { min-width: 0; }
          .summary-needs-head span { white-space: nowrap; font-size: 12px; }
          .summary-needs-head-income, .summary-needs-item { grid-template-columns: minmax(104px,1.08fr) minmax(86px,0.88fr) minmax(122px,1.18fr); }
          .summary-needs-head-expenses, .summary-needs-item-expenses { grid-template-columns: minmax(120px,1.3fr) minmax(90px,1fr); }
          .summary-needs-head-expenses-notes, .summary-needs-item-expenses-notes { grid-template-columns: minmax(120px,1.1fr) minmax(90px,0.8fr) minmax(140px,1.4fr); }
          .summary-needs-item-assets { grid-template-columns: minmax(120px,1.4fr) minmax(90px,1fr); }
          .summary-needs-card td, .summary-needs-card th { border-top: 1px solid rgba(186,143,56,0.16); padding: 5px 7px; font-size: 11px; text-align: right; }
          .summary-total-row td, .summary-total-row th { font-weight: 700; background: rgba(239,223,188,0.62); }
          .summary-recommendations { margin: 0; padding-inline-start: 20px; display: grid; gap: 5px; }
          .summary-recommendation-media { margin-top: 10px; border: 1px solid rgba(186,143,56,0.18); border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #fffdf8 0%, #f8f0df 100%); max-width: 420px; }
          .summary-recommendation-media img { display: block; width: 100%; max-height: 260px; object-fit: contain; background: #fff; }
          .summary-recommendation-media figcaption { padding: 8px 12px 12px; color: #5e6471; font-size: 12px; }
          .summary-followups { margin: 0; padding-inline-start: 20px; display: grid; gap: 4px; color: #2f3a4c; }
          .summary-compact-table { min-width: 0; font-size: 12px; }
          .summary-compact-table th, .summary-compact-table td { padding: 6px 7px; }
          .summary-inline-table-block { margin-top: 10px; break-inside: auto; page-break-inside: auto; }
          .summary-inline-table-block .summary-preview-table-wrap, .summary-inline-table-block .table-wrap { overflow: hidden; }
          .summary-inline-table-block .summary-preview-table, .summary-inline-table-block .beneficiary-compare, .summary-inline-table-block .track-legend-table { width: 100%; table-layout: fixed; }
          .summary-inline-table-block .summary-preview-table, .summary-inline-table-block .beneficiary-compare { font-size: 10.2px; }
          .summary-inline-table-block .summary-preview-table th, .summary-inline-table-block .summary-preview-table td, .summary-inline-table-block .beneficiary-compare th, .summary-inline-table-block .beneficiary-compare td, .summary-inline-table-block .track-legend-table th, .summary-inline-table-block .track-legend-table td { padding: 4px 3px; word-break: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.35; }
          .summary-inline-table-block .track-legend-table { font-size: 9.8px; }
          .summary-inline-table-block .panel { margin-top: 10px !important; }
          .beneficiary-compare, .track-legend-table { width: 100%; border-collapse: collapse; min-width: 0 !important; }
          .beneficiary-compare thead { display: table-header-group; }
          .beneficiary-compare tr, .track-legend-table tr { break-inside: avoid; page-break-inside: avoid; }
          .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { border: 1px solid #ccb788; }
          .beneficiary-compare th, .track-legend-table th { background: #f3e5c7 !important; color: #7d5d22; font-weight: 800; }
          .beneficiary-compare thead tr:first-child th,
          .beneficiary-compare thead tr:nth-child(2) th { background: #ead2a0 !important; color: #6f4f15; font-weight: 900; }
          .beneficiary-compare .matrix-active { background: #f0dfb8 !important; font-weight: 800; }
          .beneficiary-compare tbody tr:nth-child(odd) td, .track-legend-table tbody tr:nth-child(odd) td { background: #ffffff; }
          .beneficiary-compare tbody tr:nth-child(even) td, .track-legend-table tbody tr:nth-child(even) td { background: #f1f9ff; }
          .beneficiary-total-row td, .summary-total-row td, .summary-total-row span, .summary-total-row th { background: #eaf3ff !important; font-weight: 700; }
          .summary-screenshot-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
          .summary-screenshot-preview { border: 1px solid rgba(186,143,56,0.16); border-radius: 16px; overflow: hidden; background: #fff; }
          .summary-screenshot-preview img { width: 100%; display: block; }
          .summary-screenshot-preview figcaption { padding: 10px 12px 14px; font-size: 13px; color: #41506b; line-height: 1.7; }
          @media print {
            @page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }
            body { background: #fff; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .summary-inline-controls, .summary-inline-pill-note, .summary-row-remove, .summary-row-add { display: none !important; }
            .summary-recommendation-block, .summary-followup-row, .summary-fact-label-cell { padding-inline-start: 0 !important; }
            .summary-paper, .summary-paper * { box-sizing: border-box; max-width: 100%; }
            .summary-paper { margin: 0; box-shadow: none; border: 0; width: 100%; max-width: none; padding: 7mm 6mm 9mm; border-radius: 0; overflow: visible !important; }
            .summary-paper, .summary-paper * { font-family: "Heebo", "Segoe UI", Arial, sans-serif !important; }
            .summary-paper h1 { font-size: 22px; line-height: 1.2; margin-bottom: 4px; }
            .summary-paper h2 { font-size: 17px; line-height: 1.25; margin-bottom: 7px; }
            .summary-paper h3 { font-size: 15px; line-height: 1.25; }
            .summary-paper p, .summary-paper li { font-size: 12px; line-height: 1.38; margin: 2px 0; }
            .summary-paper section { break-inside: auto !important; page-break-inside: auto !important; }
            .summary-needs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
            .summary-needs-head, .summary-needs-item { padding: 4px 6px; font-size: 9.8px; gap: 5px; }
            .summary-needs-card h4 { padding: 6px 8px; font-size: 12px; }
            .summary-paper section + section { margin-top: 9px; }
            .summary-preview-table-wrap, .table-wrap, .summary-inline-table-block .summary-preview-table-wrap, .summary-inline-table-block .table-wrap { overflow: visible !important; }
            .summary-preview-table, .beneficiary-compare, .track-legend-table { width: 100% !important; max-width: 100% !important; table-layout: auto !important; }
            .summary-inline-table-block .summary-preview-table,
            .summary-inline-table-block .beneficiary-compare { font-size: 9.2px; }
            .summary-inline-table-block .track-legend-table { font-size: 8.9px; }
            .summary-inline-table-block .summary-preview-table th,
            .summary-inline-table-block .summary-preview-table td,
            .summary-inline-table-block .beneficiary-compare th,
            .summary-inline-table-block .beneficiary-compare td,
            .summary-inline-table-block .track-legend-table th,
            .summary-inline-table-block .track-legend-table td { padding: 3px 2px; white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; vertical-align: top; }
            .summary-preview-table { font-size: 9.6px; min-width: 0 !important; }
            .summary-preview-table th, .summary-preview-table td, .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { padding: 3px 3px; line-height: 1.22; white-space: normal !important; word-break: break-word !important; overflow-wrap: anywhere !important; vertical-align: top; }
            .summary-recommendation-paste:empty { display: none !important; }
            .summary-paper-title, .summary-inline-table-block, .summary-preview-table-wrap, .table-wrap, .beneficiary-compare, .track-legend-table { break-inside: auto !important; page-break-inside: auto !important; }
            .summary-preview-table th, .summary-preview-table td, .beneficiary-compare th, .beneficiary-compare td, .track-legend-table th, .track-legend-table td { border: 1px solid #bba06a !important; }
          }
        </style>
      </head>
      <body>${previewHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }

// TODO: remove DOM dependency
export async function sendMeetingSummaryToClient() {
    const clientEmail = String(state.client?.email || "").trim();
    const clientName = String(state.client?.fullName || state.client?.firstName || "").trim();
    const clientIdNumber = String(state.client?.idNumber || "").trim();
    const adviceType = state.meetingSummary.adviceType || "pension";
    if (!clientEmail) {
      showToast("לא נמצאה כתובת מייל ללקוח בדוח. אפשר לעדכן מייל בדוח או לשלוח ידנית.", true);
      return;
    }

    const typeLabel = adviceType === "retirement" ? "תכנון פרישה" : "תכנון פנסיוני";
    const greetingName = clientName || "לקוח";
    const subject = `סיכום פגישה - ${typeLabel}${clientName ? ` ${clientName}` : ""}${clientIdNumber ? ` ת.ז ${clientIdNumber}` : ""}`;
    const emailSignatureText = state.settings?.display?.emailSignatureText || getSettingsSignature();
    const bodyLines = [
      `שלום ${greetingName},`,
      "",
      adviceType === "retirement"
        ? "שמחתי ללוות אותך בתהליך תכנון הפרישה שלך."
        : "שמחתי ללוות אותך בתהליך התכנון הפנסיוני שלך.",
      "",
      adviceType === "retirement"
        ? "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה להבטיח ניצול אופטימלי של זכויותיך והיערכות כלכלית נכונה."
        : "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה לאפשר קבלת החלטות מושכלת והיערכות כלכלית נכונה.",
      "",
      "אנא השב למייל זה עם האישור הבא:",
      adviceType === "retirement"
        ? "\"מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפרישה.\""
        : "\"מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפנסיוני.\"",
      "",
      "עם קבלת האישור, אפעל מול הגופים הרלוונטיים למימוש התוכנית.",
      "",
      ...String(emailSignatureText || "").split(/\r?\n/)
    ];
    const rtlMark = "\u200F";
    const mailtoBody = bodyLines.map((line) => `${rtlMark}${line}`).join("\r\n");
    const bodyHtml = `
      <div dir="rtl" style="direction:rtl;text-align:right;font-family:Arial,'Heebo',sans-serif;line-height:1.9;color:#1f3554;">
        <p>שלום ${escapeHtml(greetingName)},</p>
        <p>${escapeHtml(adviceType === "retirement" ? "שמחתי ללוות אותך בתהליך תכנון הפרישה שלך." : "שמחתי ללוות אותך בתהליך התכנון הפנסיוני שלך.")}</p>
        <p>${escapeHtml(adviceType === "retirement" ? "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה להבטיח ניצול אופטימלי של זכויותיך והיערכות כלכלית נכונה." : "מצורף מסמך המרכז את המלצותיי המקצועיות כפי שסיכמנו, במטרה לאפשר קבלת החלטות מושכלת והיערכות כלכלית נכונה.")}</p>
        <p>אנא השב למייל זה עם האישור הבא:<br><strong>${escapeHtml(adviceType === "retirement" ? "מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפרישה." : "מאשר את המתווה המצורף ואת ביצוע התהליכים בתיק הפנסיוני.")}</strong></p>
        <p>עם קבלת האישור, אפעל מול הגופים הרלוונטיים למימוש התוכנית.</p>
        ${renderEmailSignatureHtml()}
      </div>
    `;
    const previewHtml = renderMeetingSummaryPreview();
    const payload = {
      to: clientEmail,
      cc: "save@m.surense.com",
      subjectBase64: btoa(unescape(encodeURIComponent(subject))),
      bodyTextBase64: btoa(unescape(encodeURIComponent(bodyLines.join("\n")))),
      bodyHtmlBase64: btoa(unescape(encodeURIComponent(bodyHtml))),
      previewHtmlBase64: btoa(unescape(encodeURIComponent(previewHtml))),
      clientName,
      fileBaseNameBase64: btoa(unescape(encodeURIComponent(`סיכום פגישה ${clientName || "לקוח"}`)))
    };

    try {
      showToast("מכין PDF ושולח ללקוח...");
      if (!MEETING_SUMMARY_ENDPOINT) {
        throw new Error("email endpoint disabled for standalone HTML");
      }
      const response = await fetch(MEETING_SUMMARY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "שליחת המייל נכשלה");
      }
      showToast("סיכום הפגישה נשלח ללקוח בהצלחה");
      return;
    } catch (error) {
      const mailtoUrl = `mailto:${encodeURIComponent(clientEmail)}?cc=${encodeURIComponent("save@m.surense.com")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody + "\r\n\r\n" + rtlMark + "יש לצרף את קובץ ה-PDF של סיכום הפגישה לפני השליחה.")}`;
      window.location.href = mailtoUrl;
      showToast("שירות השליחה לא זמין כרגע. נפתחה טיוטת מייל רגילה כגיבוי, ויש לצרף PDF ידנית.", true);
    }
  }
