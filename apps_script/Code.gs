// Code.gs (copy of the Google Apps Script used by the deployed web app)
// Note: This file is a local copy. To apply this change to the live web app,
// open the Apps Script editor (script.google.com) for the project and paste
// this code, then re-deploy the Web App.

const SHEET_ID = '137hNk46s2dfyN6SAQmZnOzRJ-zO032yW4AS2LvLxboc';
const SHEET_NAME = 'plans';
// API key for protecting write operations.
// This script reads the API key from Apps Script's Script Properties so
// the secret is not stored in source control. To set the key in the
// Apps Script editor:
// 1) Open the project at https://script.google.com and sign in as the
//    project owner (e.g. `nrok47`).
// 2) In the editor, open File -> Project properties -> Script properties
//    (or click the gear / Project settings and find Script properties in
//    the new IDE). Add a property named `API_KEY` with your secret value.
// 3) Save. The deployed Web App will then read the value at runtime.
//
// For local reference this file used to include a hard-coded key, but
// keep secrets in Script Properties instead of committing them.

function getApiKey() {
  try {
    return PropertiesService.getScriptProperties().getProperty('API_KEY') || '';
  } catch (err) {
    return '';
  }
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'getAll';
  if (action === 'getAll') {
    const projects = readAllProjects();
    const json = JSON.stringify(projects);
    const callback = e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'unknown_action' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const params = parsePostParams(e);
  const action = params.action;

  // Protect write operations if an API key is configured in Script Properties
  const configuredKey = getApiKey();
  if (['add','update','delete'].indexOf(action) !== -1 && configuredKey) {
    if (!params.apiKey || params.apiKey !== configuredKey) {
      return httpError(403, 'invalid_api_key');
    }
  }

  try {
    if (action === 'add') {
      const project = createProjectFromParams(params);
      const newId = addProject(project);
      return success({ ok: true, id: newId });
    } else if (action === 'update') {
      if (!params.id) return httpError(400, 'missing_id');
      const project = createProjectFromParams(params);
      const updated = updateProject(params.id, project);
      return success({ ok: updated === true });
    } else if (action === 'delete') {
      if (!params.id) return httpError(400, 'missing_id');
      const deleted = deleteProject(params.id);
      return success({ ok: deleted === true });
    } else {
      return httpError(400, 'unknown_action');
    }
  } catch (err) {
    return httpError(500, 'server_error', err && err.message);
  }
}

function parsePostParams(e) {
  if (e.postData && e.postData.type && e.postData.type.indexOf('application/json') !== -1) {
    try { return JSON.parse(e.postData.contents); } catch (err) { return {}; }
  }
  return e.parameter || {};
}

function openPlansSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id','name','group','startMonth','budget','color','status']);
  }
  return sheet;
}

function readAllProjects() {
  const sheet = openPlansSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);
  const projects = rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    obj.startMonth = Number(obj.startMonth) || 0;
    obj.budget = Number(String(obj.budget).replace(/[^0-9.-]+/g,'')) || 0;
    obj.id = String(obj.id || '');
    return obj;
  }).filter(p => p.id);
  return projects;
}

function addProject(project) {
  const sheet = openPlansSheet();
  const id = (new Date()).getTime().toString();
  const row = [id, project.name || '', project.group || '', Number(project.startMonth) || 0, Number(project.budget) || 0, project.color || '', project.status || ''];
  sheet.appendRow(row);
  return id;
}

function updateProject(id, project) {
  const sheet = openPlansSheet();
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      const values = [id, project.name || data[r][1], project.group || data[r][2], Number(project.startMonth) || Number(data[r][3]) || 0, Number(project.budget) || Number(String(data[r][4]).replace(/[^0-9.-]+/g,'')) || 0, project.color || data[r][5], project.status || data[r][6]];
      sheet.getRange(r+1, 1, 1, values.length).setValues([values]);
      return true;
    }
  }
  return false;
}

function deleteProject(id) {
  const sheet = openPlansSheet();
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]) === String(id)) {
      sheet.deleteRow(r+1);
      return true;
    }
  }
  return false;
}

function createProjectFromParams(params) {
  return {
    name: params.name || '',
    group: params.group || '',
    startMonth: typeof params.startMonth !== 'undefined' ? Number(params.startMonth) : 0,
    budget: typeof params.budget !== 'undefined' ? Number(String(params.budget).replace(/[^0-9.-]+/g,'')) : 0,
    color: params.color || '',
    status: params.status || ''
  };
}

function success(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function httpError(code, message, extra) { const out={ok:false,error:message}; if(extra) out.extra=extra; return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON); }
