import { describe, it, expect } from 'vitest';
import { parseCSV, parseProjectsFromCSV } from '../src/csvParser';

describe('CSV parser', () => {
  it('parses basic CSV with headers and rows', () => {
    const csv = 'id,name,startMonth,budget\n1,Simple Project,2,1000\n2,Another,3,2000';
    const rows = parseCSV(csv);
    expect(rows[0]).toEqual(['id', 'name', 'startMonth', 'budget']);
    expect(rows[1]).toEqual(['1', 'Simple Project', '2', '1000']);
  });

  it('handles quoted fields with commas', () => {
    const csv = 'id,name\n1,"Project, With, Commas"\n2,Normal';
    const rows = parseCSV(csv);
    expect(rows[1][1]).toBe('Project, With, Commas');
  });

  it('handles escaped quotes inside quoted fields', () => {
    const csv = 'id,quote\n1,"He said ""hello"" to me"';
    const rows = parseCSV(csv);
    expect(rows[1][1]).toBe('He said "hello" to me');
  });

  it('preserves newlines inside quoted fields', () => {
    const csv = 'id,notes\n1,"line1\nline2"\n2,ok';
    const rows = parseCSV(csv);
    expect(rows[1][1]).toBe('line1\nline2');
  });

  it('parseProjectsFromCSV normalizes types and filters invalid ids', () => {
    const csv = 'id,name,startMonth,budget\n,NoId,0,0\n10,Parsed,4,"1,234"';
    const projects = parseProjectsFromCSV(csv);
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe('10');
    expect(projects[0].startMonth).toBe(4);
    expect(projects[0].budget).toBe(1234);
  });
});
