/* AIC Sales Intelligence Google Sheet receiver.
 *
 * Script properties required:
 *   SHEET_ID       ID from the Google Sheet URL
 *   WEBHOOK_SECRET Same value as GOOGLE_SHEETS_WEBHOOK_SECRET in Supabase
 *
 * Deploy as a Web app that executes as you. Access can be set to anyone because
 * every request is still authenticated with WEBHOOK_SECRET.
 */

const TAB_NAME = 'Sales Intelligence';
const HEADERS = [
  'lead_id',
  'created_at',
  'contact_name',
  'organization',
  'submitted_job_title',
  'email',
  'phone',
  'inquiry_type',
  'submitted_need',
  'research_status',
  'matched_company',
  'researched_website',
  'industry',
  'headquarters',
  'employee_range',
  'company_summary',
  'researched_person_title',
  'person_summary',
  'fit_score',
  'recommended_service',
  'sales_angle',
  'next_action',
  'confidence',
  'review_reason',
  'sources',
  'researched_at'
];

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const payload = JSON.parse((event.postData && event.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('WEBHOOK_SECRET');
    const sheetId = props.getProperty('SHEET_ID');

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse_({ ok: false, error: 'Unauthorized' });
    }
    if (!sheetId) {
      return jsonResponse_({ ok: false, error: 'Missing SHEET_ID script property' });
    }

    const row = payload.row || {};
    const leadId = String(row.lead_id || '');
    if (!leadId) {
      return jsonResponse_({ ok: false, error: 'Missing lead_id' });
    }

    const workbook = SpreadsheetApp.openById(sheetId);
    const sheet = workbook.getSheetByName(TAB_NAME) || workbook.insertSheet(TAB_NAME);
    ensureHeader_(sheet);

    const values = HEADERS.map(function (header) {
      const value = row[header];
      return sheetSafe_(value === null || value === undefined ? '' : value);
    });
    const existingRow = findLeadRow_(sheet, leadId);
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }

    sheet.setFrozenRows(1);
    return jsonResponse_({ ok: true, action: existingRow ? 'updated' : 'inserted' });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

// Prevent submitted or researched text from being interpreted as a Sheet
// formula. The leading apostrophe is display-neutral in Google Sheets.
function sheetSafe_(value) {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#071A33')
      .setFontColor('#FFFFFF');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}

function findLeadRow_(sheet, leadId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const finder = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(leadId)
    .matchEntireCell(true)
    .findNext();
  return finder ? finder.getRow() : 0;
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
