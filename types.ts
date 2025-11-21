
export type ProjectStatus = 'ยังไม่เริ่ม' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';

export interface Project {
  id: string;
  name: string;
  startMonth: number; // 0 for October, 1 for November, etc.
  group: string;
  budget: number;
  color: string; // Tailwind CSS color class e.g., 'bg-blue-500'
  status: ProjectStatus;
  meetingStartDate?: string;
  meetingEndDate?: string;
}