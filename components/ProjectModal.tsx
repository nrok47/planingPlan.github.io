import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../types';
import { PROJECT_GROUPS } from '../constants';

const MONTH_LABELS = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
const STATUS_OPTIONS: ProjectStatus[] = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
const COLOR_OPTIONS = [
  { label: 'น้ำเงิน', value: 'bg-blue-500' },
  { label: 'เขียว', value: 'bg-green-500' },
  { label: 'แดง', value: 'bg-red-500' },
  { label: 'เหลือง', value: 'bg-yellow-500' },
  { label: 'ม่วง', value: 'bg-purple-500' },
  { label: 'ชมพู', value: 'bg-pink-500' },
  { label: 'ส้ม', value: 'bg-orange-500' },
];

export const ProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: Omit<Project, 'id'>) => void;
  project: Project | null;
}> = ({ isOpen, onClose, onSave, project }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(PROJECT_GROUPS[0]);
  const [startMonth, setStartMonth] = useState(0);
  const [duration, setDuration] = useState(1);
  const [budget, setBudget] = useState(0);
  const [color, setColor] = useState('bg-blue-500');
  const [status, setStatus] = useState<ProjectStatus>('ยังไม่เริ่ม');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setGroup(project.group);
      setStartMonth(project.startMonth);
      setDuration(project.duration || 1);
      setBudget(project.budget);
      setColor(project.color);
      setStatus(project.status);
    } else {
      setName('');
      setGroup(PROJECT_GROUPS[0]);
      setStartMonth(0);
      setDuration(1);
      setBudget(0);
      setColor('bg-blue-500');
      setStatus('ยังไม่เริ่ม');
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, group, startMonth, duration, budget, color, status });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {project ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อโครงการ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">กลุ่มงาน</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {PROJECT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เดือนเริ่มต้น</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {MONTH_LABELS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระยะเวลา (เดือน)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">งบประมาณ (บาท)</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สี</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`${c.value} h-10 rounded-md border-2 ${color === c.value ? 'border-gray-800 dark:border-white' : 'border-transparent'}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สถานะ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
