const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDISCStructure() {
  const { data, error } = await supabase
    .from('test_structures')
    .select('test_type, structure')
    .eq('test_type', 'disc')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  const structure = JSON.parse(data.structure);

  console.log('=== DISC Structure Analysis ===\n');
  console.log('Categories:', structure.categories.length);
  console.log('Total questions:', structure.categories.reduce((sum, cat) => sum + cat.questions.length, 0));
  console.log('\nFirst category:', structure.categories[0].name);
  console.log('Questions in first category:', structure.categories[0].questions.length);
  console.log('\n--- First 5 questions ---');
  structure.categories[0].questions.slice(0, 5).forEach((q, i) => {
    console.log(`\nQ${i + 1}: ${q.text}`);
    console.log(`  Type: ${q.type}`);
    console.log(`  Min: ${q.min_value}, Max: ${q.max_value}`);
    if (q.scale_descriptors && q.scale_descriptors.length > 0) {
      console.log(`  Descriptors: ${q.scale_descriptors.length} levels`);
      console.log(`  First descriptor:`, q.scale_descriptors[0]);
    }
  });

  console.log('\n=== Question naming pattern analysis ===');
  const questionIds = structure.categories[0].questions.map(q => q.id);
  console.log('Question IDs:', questionIds.slice(0, 10));
}

checkDISCStructure().catch(console.error);
