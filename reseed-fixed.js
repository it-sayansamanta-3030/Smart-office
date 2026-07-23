const supabase = require('./data/supabase');

const employees = [
  {
    name: 'Raj Singh',
    empId: 'EM001',
    email: 'raj.singh@office.io',
    department: 'Server',
    role: 'Server',
    avatar: 'RS',
    status: 'Out',
    currentRoom: null,
    lastKnownRoom: null,
    timeInRoom: 0,
    totalHoursToday: 0,
    history: []
  },
  {
    name: 'Shri Yadav',
    empId: 'EM002',
    email: 'shri.yadav@office.io',
    department: 'Admin',
    role: 'Admin',
    avatar: 'SY',
    status: 'Out',
    currentRoom: null,
    lastKnownRoom: null,
    timeInRoom: 0,
    totalHoursToday: 0,
    history: []
  },
  {
    name: 'Alice Jhon',
    empId: 'EM003',
    email: 'alice.jhon@office.io',
    department: 'Admin',
    role: 'Admin',
    avatar: 'AJ',
    status: 'Out',
    currentRoom: null,
    lastKnownRoom: null,
    timeInRoom: 0,
    totalHoursToday: 0,
    history: []
  }
];

async function seedFixed() {
  const { error } = await supabase.from('employees').insert(employees);
  if (error) console.error('Error inserting:', error);
  
  const { data } = await supabase.from('employees').select('empId, name, department, status, currentRoom, lastKnownRoom, timeInRoom, totalHoursToday, history').order('empId');
  console.log(JSON.stringify(data, null, 2));
}

seedFixed();
