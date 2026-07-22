// ============================================================
// In-Memory Data Store — Supabase-Ready
// Replace this module's exports with Supabase queries later.
// ============================================================

const employees = [
  { id: 1, name: 'Arjun Mehta',     email: 'arjun@office.io',    role: 'Engineering Lead',   department: 'Engineering',  avatar: 'AM', status: 'active' },
  { id: 2, name: 'Priya Sharma',    email: 'priya@office.io',    role: 'Product Manager',    department: 'Product',      avatar: 'PS', status: 'active' },
  { id: 3, name: 'Rahul Verma',     email: 'rahul@office.io',    role: 'Frontend Developer', department: 'Engineering',  avatar: 'RV', status: 'active' },
  { id: 4, name: 'Sneha Gupta',     email: 'sneha@office.io',    role: 'UX Designer',        department: 'Design',       avatar: 'SG', status: 'active' },
  { id: 5, name: 'Vikram Singh',    email: 'vikram@office.io',   role: 'Backend Developer',  department: 'Engineering',  avatar: 'VS', status: 'active' },
  { id: 6, name: 'Ananya Patel',    email: 'ananya@office.io',   role: 'Data Analyst',       department: 'Analytics',    avatar: 'AP', status: 'active' },
  { id: 7, name: 'Karthik Nair',    email: 'karthik@office.io',  role: 'DevOps Engineer',    department: 'Engineering',  avatar: 'KN', status: 'active' },
  { id: 8, name: 'Divya Reddy',     email: 'divya@office.io',    role: 'QA Lead',            department: 'Quality',      avatar: 'DR', status: 'active' },
  { id: 9, name: 'Amit Kumar',      email: 'amit@office.io',     role: 'HR Manager',         department: 'Human Resources', avatar: 'AK', status: 'active' },
  { id: 10, name: 'Meera Iyer',     email: 'meera@office.io',    role: 'Marketing Head',     department: 'Marketing',    avatar: 'MI', status: 'active' },
];

// Generate desks in a 5×4 grid layout
const desks = [];
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 5; col++) {
    const deskId = row * 5 + col + 1;
    const assignedEmployee = deskId <= 10 ? deskId : null;
    desks.push({
      id: deskId,
      label: `D${String(deskId).padStart(2, '0')}`,
      row,
      col,
      zone: row < 2 ? 'Engineering Zone' : 'Business Zone',
      employeeId: assignedEmployee,
      status: assignedEmployee ? 'occupied' : 'available', // occupied | available | away
    });
  }
}

// Today's date helper
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function timeStr(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Seed attendance for today
const attendance = [];
const today = todayStr();
const checkInTimes = [
  { h: 8, m: 55 }, { h: 9, m: 2 }, { h: 9, m: 15 }, { h: 8, m: 45 },
  { h: 9, m: 30 }, { h: 9, m: 5 }, { h: 8, m: 50 }, { h: 9, m: 20 },
  null, // Amit hasn't checked in yet
  { h: 9, m: 10 },
];

checkInTimes.forEach((time, idx) => {
  if (time) {
    const isLate = time.h > 9 || (time.h === 9 && time.m > 15);
    attendance.push({
      id: idx + 1,
      employeeId: idx + 1,
      date: today,
      checkIn: timeStr(time.h, time.m),
      checkOut: null,
      status: isLate ? 'late' : 'on-time',
    });
  }
});

// Seed historical attendance (last 7 days)
let maxId = 0;
attendance.forEach(a => { if (a.id > maxId) maxId = a.id; });
let attendanceIdCounter = maxId + 1;

for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  const dateStr = d.toISOString().split('T')[0];
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

  employees.forEach((emp) => {
    const rand = Math.random();
    if (rand > 0.1) { // 90% attendance rate
      const h = 8 + Math.floor(Math.random() * 2);
      const m = Math.floor(Math.random() * 60);
      const isLate = h > 9 || (h === 9 && m > 15);
      attendance.push({
        id: attendanceIdCounter++,
        employeeId: emp.id,
        date: dateStr,
        checkIn: timeStr(h, m),
        checkOut: timeStr(h + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)),
        status: isLate ? 'late' : 'on-time',
      });
    }
  });
}

// Seed tasks
let taskIdCounter = 1;
const tasks = [
  { id: taskIdCounter++, title: 'Set up CI/CD pipeline',           description: 'Configure GitHub Actions for automated deployment',     status: 'done',        priority: 'high',   assigneeId: 7, deadline: '2026-07-20' },
  { id: taskIdCounter++, title: 'Design dashboard mockups',        description: 'Create Figma mockups for the analytics dashboard',      status: 'done',        priority: 'high',   assigneeId: 4, deadline: '2026-07-18' },
  { id: taskIdCounter++, title: 'Implement authentication',        description: 'Add JWT-based auth with login/signup flow',             status: 'in-progress', priority: 'high',   assigneeId: 5, deadline: '2026-07-25' },
  { id: taskIdCounter++, title: 'Build attendance API',            description: 'REST endpoints for check-in/out and attendance logs',   status: 'in-progress', priority: 'high',   assigneeId: 1, deadline: '2026-07-24' },
  { id: taskIdCounter++, title: 'Floor map interactive UI',        description: 'SVG-based interactive floor plan with desk status',     status: 'in-progress', priority: 'medium', assigneeId: 3, deadline: '2026-07-26' },
  { id: taskIdCounter++, title: 'Write unit tests for API',        description: 'Jest tests for all backend endpoints',                  status: 'todo',        priority: 'medium', assigneeId: 8, deadline: '2026-07-28' },
  { id: taskIdCounter++, title: 'User onboarding flow',            description: 'Create onboarding wizard for new employees',            status: 'todo',        priority: 'low',    assigneeId: 2, deadline: '2026-07-30' },
  { id: taskIdCounter++, title: 'Analytics data pipeline',         description: 'Set up data aggregation for attendance analytics',      status: 'todo',        priority: 'medium', assigneeId: 6, deadline: '2026-07-29' },
  { id: taskIdCounter++, title: 'Performance optimization',        description: 'Optimize React renders and API response times',         status: 'todo',        priority: 'low',    assigneeId: 3, deadline: '2026-08-01' },
  { id: taskIdCounter++, title: 'Employee directory feature',      description: 'Searchable employee directory with profiles',           status: 'todo',        priority: 'low',    assigneeId: 9, deadline: '2026-08-03' },
  { id: taskIdCounter++, title: 'Marketing website copy',          description: 'Write landing page content and update branding',        status: 'in-progress', priority: 'medium', assigneeId: 10, deadline: '2026-07-27' },
  { id: taskIdCounter++, title: 'Mobile responsive design',        description: 'Ensure all pages work on tablets and mobile devices',   status: 'todo',        priority: 'high',   assigneeId: 4, deadline: '2026-07-31' },
];

module.exports = {
  employees,
  desks,
  attendance,
  tasks,
  todayStr,
};
