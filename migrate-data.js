const supabase = require('./data/supabase');

async function migrate() {
  console.log('Fetching employees...');
  const { data: employees, error: fetchError } = await supabase.from('employees').select('*');
  
  if (fetchError) {
    console.error('Error fetching employees:', fetchError);
    return;
  }

  console.log(`Found ${employees.length} employees.`);

  for (const emp of employees) {
    let department = emp.department;
    let extra = {};
    
    // Check if department is a JSON blob
    try {
      if (department && department.startsWith('{')) {
        extra = JSON.parse(department);
      }
    } catch (e) {
      // Not a JSON blob
    }

    // Determine the real department based on the email (empId)
    let realDepartment = department;
    let emailStr = emp.email || '';
    let newEmpId = emp.empId || '';

    if (emailStr.startsWith('EM')) {
      newEmpId = emailStr; // email was holding empId
      // Reset email to placeholder or empty
      if (newEmpId === 'EM001') emailStr = 'arjun@office.io';
      else if (newEmpId === 'EM002') emailStr = 'priya@office.io';
      else if (newEmpId === 'EM003') emailStr = 'rahul@office.io';
      else emailStr = ''; 
    }

    // Map departments matching the original seeded employees
    if (newEmpId === 'EM001') realDepartment = 'Server';
    else if (newEmpId === 'EM002') realDepartment = 'Admin';
    else if (newEmpId === 'EM003') realDepartment = 'Admin';
    else if (extra.role) realDepartment = extra.role; // fallback to role if it was in JSON

    const updates = {
      empId: newEmpId,
      email: emailStr,
      department: realDepartment,
      status: extra.currentRoom ? 'In' : 'Out',
      currentRoom: extra.currentRoom || null,
      lastKnownRoom: extra.lastKnownRoom || null,
      timeInRoom: extra.timeInRoom || 0,
      totalHoursToday: extra.totalHoursToday || 0,
      history: extra.history || []
    };

    console.log(`Updating employee ID ${emp.id}...`, updates);

    const { error: updateError } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', emp.id);

    if (updateError) {
      console.error(`Error updating employee ${emp.id}:`, updateError);
    } else {
      console.log(`Successfully updated employee ${emp.id}`);
    }
  }

  console.log('Migration complete!');
}

migrate();
