const supabase = require('./data/supabase');
const { employees, desks, attendance, tasks } = require('./data/seed');

async function seedDatabase() {
  console.log('Seeding Supabase Database...');

  // 1. Employees
  console.log('Inserting Employees...');
  const { error: empError } = await supabase.from('employees').upsert(employees);
  if (empError) console.error('Error inserting employees:', empError);

  // 2. Desks
  console.log('Inserting Desks...');
  const { error: deskError } = await supabase.from('desks').upsert(desks);
  if (deskError) console.error('Error inserting desks:', deskError);

  // 3. Attendance
  console.log('Inserting Attendance...');
  const { error: attError } = await supabase.from('attendance').upsert(attendance);
  if (attError) console.error('Error inserting attendance:', attError);

  // 4. Tasks
  console.log('Inserting Tasks...');
  const { error: taskError } = await supabase.from('tasks').upsert(tasks);
  if (taskError) console.error('Error inserting tasks:', taskError);

  console.log('Seeding complete!');
  process.exit(0);
}

seedDatabase();
