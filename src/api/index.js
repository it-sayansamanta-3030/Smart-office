export const API_BASE = '/api';

async function request(path, options = {}) {
  // Append a cache-busting timestamp to GET requests just to be absolutely sure
  const urlPath = (!options.method || options.method === 'GET') 
    ? (path.includes('?') ? `${path}&_t=${Date.now()}` : `${path}?_t=${Date.now()}`)
    : path;

  const res = await fetch(`${API_BASE}${urlPath}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store', // Disable browser caching
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}

// Employees
export const getEmployees = () => request('/employees');
export const getEmployee = (id) => request(`/employees/${id}`);
export const createEmployee = (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) });
export const updateEmployee = (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' });

// Attendance
export const getAttendance = (date) => request(`/attendance${date ? `?date=${date}` : ''}`);
export const checkIn = (employeeId) => request('/attendance/checkin', { method: 'POST', body: JSON.stringify({ employeeId }) });
export const checkOut = (employeeId) => request('/attendance/checkout', { method: 'POST', body: JSON.stringify({ employeeId }) });

// Desks
export const getDesks = () => request('/desks');
export const assignDesk = (deskId, employeeId) => request(`/desks/${deskId}/assign`, { method: 'PUT', body: JSON.stringify({ employeeId }) });
export const releaseDesk = (deskId) => request(`/desks/${deskId}/release`, { method: 'PUT' });

// Tasks
export const getTasks = (status) => request(`/tasks${status ? `?status=${status}` : ''}`);
export const createTask = (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, updates) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// Analytics
export const getAttendanceAnalytics = () => request('/analytics/attendance');
export const getOccupancyAnalytics = () => request('/analytics/occupancy');
export const getTaskAnalytics = () => request('/analytics/tasks');
