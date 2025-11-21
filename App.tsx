
import React, { useState, useEffect, useMemo } from 'react';
import { ProjectGanttChart } from './components/ProjectGanttChart';
import { ProjectModal } from './components/ProjectModal';
import { CalendarModal } from './components/CalendarModal';
import { Project, ProjectStatus } from './types';
import { SunIcon, MoonIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, ArrowPathIcon, ArrowDownTrayIcon } from './components/Icons';
import { PROJECT_GROUPS } from './constants';

type SortKey = keyof Project | 'default';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// Deployment base URL (set via env `VITE_DEPLOY_URL`). Fallback to root for local dev.
const DEPLOY_URL = import.meta.env.VITE_DEPLOY_URL ?? '/';
const PROJECTS_CSV_URL = DEPLOY_URL.endsWith('/') ? `${DEPLOY_URL}projects.csv` : `${DEPLOY_URL}/projects.csv`;
// Optional Apps Script / API endpoint to fetch projects from: set `VITE_API_URL` in your environment.
const API_URL = import.meta.env.VITE_API_URL ?? '';

// JSONP helper (used if the Apps Script endpoint only supports JSONP / to bypass CORS)
function jsonpFetch(url: string, timeout = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `__jsonp_cb_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const sep = url.includes('?') ? '&' : '?';
    const src = `${url}${sep}callback=${callbackName}`;
    const script = document.createElement('script');
    let timer: number | undefined;
    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };
    script.src = src;
    script.onerror = () => {
      clearTimeout(timer);
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('JSONP script error'));
    };
    document.body.appendChild(script);
    timer = window.setTimeout(() => {
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('JSONP timeout'));
    }, timeout);
  });
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

  // Load projects from localStorage or CSV on initial render
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const savedProjects = localStorage.getItem('projectsData');
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects));
        } else {
          // Try Apps Script / API URL first (if provided), otherwise fall back to CSV
          let loaded = false;
          if (API_URL) {
            try {
              const apiResp = await fetch(`${API_URL}?action=getAll`, { headers: { 'Accept': 'application/json' } });
              if (apiResp.ok) {
                const data = await apiResp.json();
                if (Array.isArray(data)) {
                  setProjects(data as Project[]);
                  loaded = true;
                }
              }
            } catch (err) {
              // network or CORS error — try JSONP fallback
              try {
                const data = await jsonpFetch(`${API_URL}?action=getAll`);
                if (Array.isArray(data)) {
                  setProjects(data as Project[]);
                  loaded = true;
                }
              } catch (err2) {
                console.warn('API JSONP fallback failed', err2);
              }
            }
          }

          if (!loaded) {
            // fallback: fetch projects.csv from the deployed base
            const response = await fetch(PROJECTS_CSV_URL);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const projectData: Project[] = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const projectObject = headers.reduce((obj, header, index) => {
                const value = values[index];
                switch (header) {
                  case 'startMonth':
                  case 'budget':
                    obj[header as keyof Project] = parseInt(value, 10) || 0;
                    break;
                  case 'meetingStartDate':
                  case 'meetingEndDate':
                    obj[header as keyof Project] = value || undefined;
                    break;
                  case 'status':
                    obj[header as keyof Project] = value as ProjectStatus;
                    break;
                  default:
                    obj[header as keyof Project] = value;
                }
                return obj;
              }, {} as Record<keyof Project, any>);
              return projectObject as Project;
            });
            setProjects(projectData);
          }
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    // Don't save the initial empty array or during loading
    if (projects.length > 0 && !loading) {
      localStorage.setItem('projectsData', JSON.stringify(projects));
    }
  }, [projects, loading]);


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
    if (editingProject) {
      setProjects(projects.map(p => 
        p.id === editingProject.id ? { ...editingProject, ...projectData } : p
      ));
    } else {
      const newProject: Project = {
        ...projectData,
        id: `p${Date.now()}`,
      };
      setProjects([...projects, newProject]);
    }
    handleCloseModal();
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้?')) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };
  
  const handleResetData = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น? การเปลี่ยนแปลงทั้งหมดของคุณจะหายไป')) {
      localStorage.removeItem('projectsData');
      window.location.reload();
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