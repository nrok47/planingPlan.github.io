import React from 'react';
import { Project } from '../types';

export interface ProjectGanttChartProps {
  projects: Project[];
  setProjects: (p: Project[]) => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onMonthHeaderClick?: (index: number) => void;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ projects }) => {
  // Minimal placeholder rendering the project list; the real implementation
  // is not required for CI — this prevents import resolution errors.
  return (
    <div>
      <h2 className="text-lg font-medium">Gantt chart (placeholder)</h2>
      <ul>
        {projects.map(p => (
          <li key={p.id} className="py-1">{p.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectGanttChart;
