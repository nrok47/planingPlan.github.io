import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectGanttChart } from './components/ProjectGanttChart';
import { ProjectModal } from './components/ProjectModal';
import { CalendarModal } from './components/CalendarModal';
import { Project, ProjectStatus } from './types';
import { SunIcon, MoonIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, ArrowPathIcon, ArrowDownTrayIcon } from './components/Icons';
import { PROJECT_GROUPS } from './constants';
// Inline lightweight CSV parser fallback (kept local to avoid import issues)
const splitCsvLine = (line: string) => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map(s => s.trim());
};

const parseProjectsFromCSV = (csvText: string): Project[] => {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];
  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1);
  const projectData: Project[] = rows.map(line => {
    const values = splitCsvLine(line);
    const obj = headers.reduce((acc: any, header, idx) => {
      const value = values[idx] ?? '';
      if (header === 'startMonth' || header === 'budget') {
        acc[header] = parseInt(value, 10) || 0;
      } else if (header === 'meetingStartDate' || header === 'meetingEndDate') {
        acc[header] = value || undefined;
      } else if (header === 'status') {
        acc[header] = value as ProjectStatus;
      } else {
        acc[header] = value;
      }
      return acc;
    }, {});
    return obj as Project;
  });
  return projectData;
};

type SortKey = keyof Project | 'default';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'default', direction: 'asc' });
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [calendarModalMonth, setCalendarModalMonth] = useState<number | null>(null);
  // Toast notifications
  type ToastType = 'success' | 'error' | 'info';
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info', duration = 4000) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), duration);
  };

  // Detect dev mode (Vite sets MODE). Use any cast to avoid TS errors in this environment.
  const IS_DEV = ((import.meta as any).env?.MODE === 'development');

  // Extracted loader so we can call it from a dev button to force refetch.
  // API-first loader (Google Sheets via Apps Script). No localStorage.
  const API_URL = ((import.meta as any).env?.VITE_API_URL) as string | undefined;
  const API_KEY = ((import.meta as any).env?.VITE_API_KEY) as string | undefined;

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      if (!API_URL) {
        throw new Error('VITE_API_URL is not configured. Set VITE_API_URL to your Apps Script endpoint.');
      }

      const url = `${API_URL}?action=getAll`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const contentType = resp.headers.get('content-type') || '';
      const text = await resp.text();

      let projectData: Project[] = [];

      // Try JSON first
      if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          // Normalize shapes: [] | { data: [] } | { projects: [] }
          if (Array.isArray(parsed)) {
            projectData = parsed as Project[];
          } else if (parsed?.data && Array.isArray(parsed.data)) {
            projectData = parsed.data;
          } else if (parsed?.projects && Array.isArray(parsed.projects)) {
            projectData = parsed.projects;
          } else {
            // Fallback: try to extract array from object
            const arr = Object.values(parsed).find(v => Array.isArray(v));
            if (Array.isArray(arr)) projectData = arr as Project[];
            else projectData = [];
          }
        } catch (err) {
          // Not JSON, fall through to CSV parser
          projectData = parseProjectsFromCSV(text);
        }
      } else {
        // Treat as CSV/text
        projectData = parseProjectsFromCSV(text);
      }

      setProjects(projectData);
    } catch (error) {
      console.error('Failed to load projects from API:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Load projects on initial render
  useEffect(() => { loadProjects(); }, [loadProjects]);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };
  
  const handleSaveProject = (projectData: Omit<Project, 'id'>) => {
    (async () => {
      try {
        if (!API_URL) throw new Error('VITE_API_URL not set');
        let resp, result;
        if (editingProject) {
          const payload = { action: 'update', project: { ...(editingProject || {}), ...projectData }, apiKey: API_KEY };
          resp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          result = await resp.json();
          if (result && result.ok) {
            showToast('บันทึกโครงการสำเร็จ', 'success');
          } else {
            throw new Error(result && result.error ? result.error : 'update_failed');
          }
        } else {
          const payload = { action: 'add', project: projectData, apiKey: API_KEY };
          resp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          result = await resp.json();
          if (result && result.ok) {
            showToast('เพิ่มโครงการสำเร็จ', 'success');
          } else {
            throw new Error(result && result.error ? result.error : 'add_failed');
          }
        }
        await loadProjects();
      } catch (err) {
        console.error('Failed to save project to API', err);
        showToast('ไม่สามารถบันทึกโครงการได้ โปรดลองใหม่', 'error');
      } finally {
        handleCloseModal();
      }
    })();
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้?')) return;
    (async () => {
      try {
        if (!API_URL) throw new Error('VITE_API_URL not set');
        const payload = { action: 'delete', id: projectId, apiKey: API_KEY };
        const resp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await resp.json();
        if (result && result.ok) {
          showToast('ลบโครงการสำเร็จ', 'success');
        } else {
          throw new Error(result && result.error ? result.error : 'delete_failed');
        }
        await loadProjects();
      } catch (err) {
        console.error('Failed to delete project', err);
        showToast('ไม่สามารถลบโครงการได้ โปรดลองใหม่', 'error');
      }
    })();
  };
  
  const handleResetData = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีโหลดข้อมูลจาก Google Sheet? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกอาจหายไป')) {
      loadProjects();
    }
  };

  const handleReloadFromRemote = async () => {
    try {
      await loadProjects();
    } catch (err) {
      console.error('Failed to reload from remote', err);
    }
  };
  
  const handleMonthHeaderClick = (monthIndex: number) => {
    setCalendarModalMonth(monthIndex);
  };

  const handleCloseCalendarModal = () => {
    setCalendarModalMonth(null);
  };

  const handleDownloadCsv = () => {
    const headers = ['id', 'name', 'group', 'startMonth', 'budget', 'color', 'status', 'meetingStartDate', 'meetingEndDate'];
    const csvRows = [headers.join(',')];

    const escapeCsvCell = (cell: any) => {
      if (cell === undefined || cell === null) return '';
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    projects.forEach(project => {
      const row = headers.map(header => escapeCsvCell(project[header as keyof Project]));
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = 'projects_updated.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAndSortedProjects = useMemo(() => {
    const filteredProjects = selectedGroup === 'all'
      ? [...projects]
      : projects.filter(p => p.group === selectedGroup);

    const sortableProjects = [...filteredProjects];
    if (sortConfig.key !== 'default') {
      sortableProjects.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Project];
        const bValue = b[sortConfig.key as keyof Project];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProjects;
  }, [projects, sortConfig, selectedGroup]);

  const handleSortChange = (key: SortKey) => {
     if (key === sortConfig.key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  }

  const toggleSortDirection = () => {
    setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }

  // Toast UI (simple)
  const ToastView: React.FC = () => {
    if (!toast) return null;
    const base = 'fixed right-4 top-6 z-50 rounded-md px-4 py-2 shadow-lg text-sm';
    const style = toast.type === 'success'
      ? `${base} bg-green-600 text-white`
      : toast.type === 'error'
      ? `${base} bg-red-600 text-white`
      : `${base} bg-gray-800 text-white`;
    return (
      <div className={style} role="status" aria-live="polite">
        {toast.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-primary-400">
              ตารางกำกับและติดตามโครงการ
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              ปีงบประมาณ 2569 (ต.ค. 68 - ก.ย. 69) - ลากกิจกรรมเพื่อเปลี่ยนเดือน
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
             <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                <select 
                  onChange={(e) => setSelectedGroup(e.target.value)} 
                  value={selectedGroup}
                  className="bg-transparent text-sm font-medium focus:outline-none text-gray-600 dark:text-gray-300 pr-2"
                  aria-label="Filter by group"
                >
                  <option value="all">ทุกกลุ่มงาน</option>
                  {PROJECT_GROUPS.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
            </div>
             <div className="flex items-center rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
              <select 
                onChange={(e) => handleSortChange(e.target.value as SortKey)} 
                value={sortConfig.key}
                className="bg-transparent text-sm font-medium focus:outline-none text-gray-600 dark:text-gray-300 pr-2"
                aria-label="Sort by"
              >
                <option value="default">เรียงลำดับ</option>
                <option value="name">ชื่อโครงการ</option>
                <option value="group">กลุ่มงาน</option>
                <option value="startMonth">เดือนเริ่มต้น</option>
                <option value="budget">งบประมาณ</option>
                <option value="status">สถานะ</option>
              </select>
              <button 
                onClick={toggleSortDirection} 
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md"
                aria-label="Toggle sort direction"
              >
                {sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
              aria-label="เพิ่มโครงการใหม่"
            >
              <PlusIcon className="h-5 w-5" />
              <span>เพิ่ม</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
              aria-label="ดาวน์โหลด CSV"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            {IS_DEV && (
              <button
                onClick={handleReloadFromRemote}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
                aria-label="Reload from remote"
                title="Reload from remote (dev only)"
              >
                Reload
              </button>
            )}
            <button
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
              aria-label="รีเซ็ตข้อมูล"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
          </div>
        </header>

        <main>
          <ProjectGanttChart 
            projects={filteredAndSortedProjects} 
            setProjects={setProjects}
            onEditProject={handleOpenEditModal}
            onDeleteProject={handleDeleteProject}
            onMonthHeaderClick={handleMonthHeaderClick}
          />
        </main>
        
        <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>สร้างโดย Senior Frontend React Engineer</p>
        </footer>
      </div>
      
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        project={editingProject}
      />
      
      {calendarModalMonth !== null && (
        <CalendarModal
          isOpen={calendarModalMonth !== null}
          onClose={handleCloseCalendarModal}
          monthIndex={calendarModalMonth}
          projects={projects}
        />
      )}
    </div>
  );
};

export default App;