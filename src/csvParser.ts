import { Project } from '../types';

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let inQuotes = false;
  let field = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        cur.push(field);
        field = '';
      } else if (ch === '\r') {
        // ignore
      } else if (ch === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  // push last field
  // push whatever remains
  cur.push(field);
  if (cur.length > 0 && !(cur.length === 1 && cur[0] === '')) {
    rows.push(cur);
  }
  return rows.map(r => r.map(c => c.trim()));
}

export function parseProjectsFromCSV(text: string): Project[] {
  // Strip possible BOM and normalize line endings
  const cleaned = text.replace(/\uFEFF/g, '');
  const rows = parseCSV(cleaned);
  if (rows.length < 1) return [];
  // Normalize headers (trim, remove BOM) and map to project fields
  const headers = rows[0].map(h => String(h || '').replace(/\uFEFF/g, '').trim());
  const projectData: Project[] = rows.slice(1).map(values => {
    const obj = headers.reduce((acc, header, idx) => {
      const key = header as keyof Project;
      acc[key] = values[idx];
      return acc;
    }, {} as Record<keyof Project, any>);
    // Normalize types
    obj.startMonth = Number(obj.startMonth) || 0;
    obj.budget = Number(String(obj.budget).replace(/[^0-9.-]+/g, '')) || 0;
    obj.id = String(obj.id || '');
    return obj as Project;
  }).filter(p => p.id);
  return projectData;
}

export default parseCSV;
