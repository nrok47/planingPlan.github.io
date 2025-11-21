// Apps Script web app to serve projects from Google Sheet
// Adjust SHEET_ID and SHEET_NAME to your spreadsheet
const SHEET_ID = '<<YOUR_SHEET_ID>>';
const SHEET_NAME = 'Sheet1';

function doGet(e) {
  const action = (e.parameter.action || 'getAll').toString();
  const callback = e.parameter.callback;
  let output;

  if (action === 'getAll') {
    const projects = getProjectsFromSheet();
    output = JSON.stringify(projects);
  } else {
    output = JSON.stringify({ error: 'unknown action' });
  }

  if (callback) {
    // JSONP response to avoid CORS when used from static sites
    return ContentService
      .createTextOutput(`${callback}(${output})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function getProjectsFromSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues(); // includes header row
  if (!values || values.length < 2) return [];

  const headersRaw = values[0];
  const headers = headersRaw.map(h => String(h || '').trim());

  const rows = values.slice(1);
  const projects = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });

    // Normalize fields to match frontend `Project` type
    // headers expected: id,name,group,startMonth,budget,color,status,meetingStartDate,meetingEndDate
    const p = {
      id: String(obj['id'] || '').trim(),
      name: String(obj['name'] || '').trim(),
      group: String(obj['group'] || '').trim(),
      startMonth: Number(obj['startMonth']) || 0,
      budget: Number(String(obj['budget'] || '').replace(/[^0-9.-]+/g, '')) || 0,
      color: String(obj['color'] || '').trim(),
      status: String(obj['status'] || '').trim(),
      meetingStartDate: obj['meetingStartDate'] ? String(obj['meetingStartDate']).trim() : '',
      meetingEndDate: obj['meetingEndDate'] ? String(obj['meetingEndDate']).trim() : ''
    };
    return p;
  }).filter(p => p.id);

  return projects;
}
