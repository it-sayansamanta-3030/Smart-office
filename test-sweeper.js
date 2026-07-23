const supabase = require('./data/supabase');

async function runSweeper() {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, empId, name, currentRoom, history')
      .eq('status', 'In')
      .not('currentRoom', 'is', null);

    if (error || !employees) {
       console.log('Error fetching employees:', error);
       return;
    }

    console.log('Employees in room:', employees.length);
    const now = new Date();
    const TIMEOUT_MS = 30000;

    for (const emp of employees) {
      if (!emp.history || emp.history.length === 0) continue;

      const lastPing = new Date(emp.history[emp.history.length - 1].timestamp);
      const diff = now - lastPing;
      console.log(`Employee ${emp.empId} diff: ${diff}ms`);
      
      if (diff > TIMEOUT_MS) {
        console.log(`Would timeout ${emp.empId}`);
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: record, error: recErr } = await supabase.from('attendance')
          .select('*').eq('employeeId', emp.id).eq('date', todayStr).maybeSingle();
        
        if (recErr) console.log('Attendance fetch error:', recErr);
        if (record) console.log('Found attendance record for auto checkout');
      }
    }
  } catch (err) {
    console.error('[Sweeper Error]', err);
  }
}
runSweeper();
