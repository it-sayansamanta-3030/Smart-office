const supabase = require('./data/supabase');

async function checkDb() {
  const { data } = await supabase.from('employees').select('*');
  console.log(data);
}
checkDb();
