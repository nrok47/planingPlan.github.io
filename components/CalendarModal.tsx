import React from 'react';
import { Project } from '../types';

export const CalendarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  monthIndex: number | null;
  projects: Project[];
}> = ({ isOpen, onClose, monthIndex, projects }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium">Calendar for month {monthIndex}</h3>
        <ul className="mt-2">
          {projects.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
        <div className="mt-2"><button onClick={onClose} className="text-sm text-blue-600">Close</button></div>
      </div>
    </div>
  );
};

export default CalendarModal;
