/**
 * Go Offscript early-bird sign-ups → this Google Sheet.
 * Paste into the Sheet's Extensions → Apps Script, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the web app URL into SHEET_URL in offscript/index.html.
 */
const SHEET_NAME = 'signups';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['reserved at', 'email', 'code', 'consent', 'source']);
      sheet.setFrozenRows(1);
    }
    const p = e.parameter || {};
    const email = String(p.email || '').trim().toLowerCase().slice(0, 254);
    const code = String(p.code || '').slice(0, 40);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^GOS-[A-F0-9]{24}$/.test(code)) {
      return ContentService.createTextOutput('invalid');
    }
    // One free week per email: keep the first reservation.
    const last = sheet.getLastRow();
    if (last > 1) {
      const emails = sheet.getRange(2, 2, last - 1, 1).getValues().flat();
      if (emails.indexOf(email) !== -1) return ContentService.createTextOutput('exists');
    }
    sheet.appendRow([new Date(), email, code, p.consent === 'yes' ? 'yes' : 'no', String(p.source || '').slice(0, 60)]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}
