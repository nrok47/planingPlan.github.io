import React from 'react';
import { Project } from '../types';

export interface ProjectGanttChartProps {
  projects: Project[];
  setProjects?: (p: Project[]) => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onMonthHeaderClick?: (index: number) => void;
}

// Thai short month labels (starting from October as index 0)
const MONTH_LABELS = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects, onEditProject, onDeleteProject, onMonthHeaderClick }) => {
  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">แผนการ (Gantt)</div>

      <div className="min-w-full">
        <div className="grid grid-cols-[18rem_repeat(12,6rem)] gap-2 items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
          <div className="pl-3 text-sm font-semibold text-gray-600 dark:text-gray-300">โครงการ</div>
          {MONTH_LABELS.map((m, idx) => (
            <button
              key={m}
              onClick={() => onMonthHeaderClick?.(idx)}
              className="text-xs-compact w-full text-center text-gray-600 dark:text-gray-300"
              aria-label={`Open month ${m}`}
            >
              <div className="text-xs font-medium">{m}</div>
              <div className="text-[10px] text-gray-400">68</div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {projects.map(project => (
            <div key={project.id} className="grid grid-cols-[18rem_repeat(12,6rem)] gap-2 items-center bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{project.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{project.group} • {project.status}</div>
                </div>
                <div className="ml-2 flex-shrink-0 space-x-1">
                  <button onClick={() => onEditProject(project)} className="text-indigo-600 hover:text-indigo-400 text-sm">แก้ไข</button>
                  <button onClick={() => onDeleteProject(project.id)} className="text-red-600 hover:text-red-400 text-sm">ลบ</button>
                </div>
              </div>

              {MONTH_LABELS.map((_, monthIdx) => {
                const isStart = Number(project.startMonth) === monthIdx;
                return (
                  <div key={monthIdx} className="h-14 flex items-center justify-center">
                    {isStart ? (
                      <div 
                        className="rounded-lg text-white text-xs px-3 py-2 shadow-md max-w-[90%]"
                        style={{ backgroundColor: project.color || '#3b82f6' }}
                      > 
                        <div className="font-medium">{project.name}</div>
                        <div className="text-[11px] text-white/90 truncate">{project.meetingStartDate ? `ประชุม: ${project.meetingStartDate}` : ''}</div>
                        <div className="text-[11px] text-white/90">งบ: {project.budget?.toLocaleString?.() ?? project.budget}</div>
                      </div>
                    ) : (
                      <div className="w-full h-2" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttChart;
