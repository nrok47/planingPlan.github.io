import React from 'react';
import { Project } from '../types';

export const ProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: Omit<Project, 'id'>) => void;
  project: Project | null;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow">Project modal (placeholder)
        <div className="mt-2"><button onClick={onClose} className="text-sm text-blue-600">Close</button></div>
      </div>
    </div>
  );
};

export default ProjectModal;
