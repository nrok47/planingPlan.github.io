import { ProjectStatus } from "./types";

export const MONTHS: { name: string; year: string }[] = [
  { name: 'ต.ค.', year: '68' },
  { name: 'พ.ย.', year: '68' },
  { name: 'ธ.ค.', year: '68' },
  { name: 'ม.ค.', year: '69' },
  { name: 'ก.พ.', year: '69' },
  { name: 'มี.ค.', year: '69' },
  { name: 'เม.ย.', year: '69' },
  { name: 'พ.ค.', year: '69' },
  { name: 'มิ.ย.', year: '69' },
  { name: 'ก.ค.', year: '69' },
  { name: 'ส.ค.', year: '69' },
  { name: 'ก.ย.', year: '69' },
];

// Cumulative target percentages for each month from Oct to Sep
export const TARGET_PERCENTAGES: number[] = [
  10.0, 18.5, 27.0, 35.5, 44.0, 52.5, 61.0, 69.5, 78.0, 86.5, 95.0, 100.0,
];

export const PROJECT_COLORS: string[] = [
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-amber-600',
    'bg-pink-600',
    'bg-teal-600',
    'bg-red-600',
    'bg-indigo-600',
];

export const PROJECT_GROUPS: string[] = [
    'กลุ่มอำนวยการ',
    'กลุ่มยุทธฯ',
    'กลุ่มส่งเสริมสุขภาพ',
    'กลุ่มสิ่งแวดล้อม',
    'กลุ่มคุ้มครองผู้บริโภค',
    'กลุ่มอนามัยสิ่งแวดล้อม'
];

export const PROJECT_STATUSES: ProjectStatus[] = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จสิ้น'];

export const STATUS_INDICATOR_CLASSES: Record<ProjectStatus, { border: string }> = {
  'ยังไม่เริ่ม': { border: 'border-gray-400' },
  'กำลังดำเนินการ': { border: 'border-yellow-500' },
  'เสร็จสิ้น': { border: 'border-green-500' },
};
