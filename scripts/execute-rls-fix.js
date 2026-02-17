import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

async function executeRLSFix() {
  // Construct PostgreSQL connection string from Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY não configurados');
  }

  // Extract host from Supabase URL
  const urlObj = new URL(supabaseUrl);
  const host = urlObj.hostname;
  const projectRef = host.split('.')[0];

  // Supabase connection details
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: supabaseServiceKey,
    ssl: { rejectUnauthorized: false },
  });

  const sqlQueries = [
    // Enable RLS
    'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;',
    
    // Drop existing policies
    'DROP POLICY IF EXISTS "allow_insert_for_authenticated" ON public.users;',
    'DROP POLICY IF EXISTS "allow_register" ON public.users;',
    'DROP POLICY IF EXISTS "allow_select_own_user" ON public.users;',
    'DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;',
    
    // Create INSERT policy
    `CREATE POLICY "allow_insert_for_authenticated"
     ON public.users
     FOR INSERT
     WITH CHECK (auth.uid() = auth_id);`,
    
    // Create SELECT policy
    `CREATE POLICY "allow_select_own_user"
     ON public.users
     FOR SELECT
     USING (auth.uid() = auth_id);`,
    
    // Create UPDATE policy
    `CREATE POLICY "allow_update_own_user"
     ON public.users
     FOR UPDATE
     USING (auth.uid() = auth_id);`,
  ];

  console.log('🔧 Executando ajustes de RLS...\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase PostgreSQL\n');

    for (const query of sqlQueries) {
      try {
        await client.query(query);
        console.log(`✅ ${query.substring(0, 60)}${query.length > 60 ? '...' : ''}`);
      } catch (err) {
        // Some errors are expected (like dropping non-existent policies)
        if (err.message.includes('does not exist')) {
          console.log(`⏭️  ${query.substring(0, 60)}... (não existia)`);
        } else {
          console.log(`⚠️  ${query.substring(0, 60)}...`);
          console.log(`   Erro: ${err.message}\n`);
        }
      }
    }

    // Verify policies
    console.log('\n📋 Verificando policies criadas...\n');
    const result = await client.query(`
      SELECT schemaname, tablename, policyname, QUAL, WITH_CHECK
      FROM pg_policies
      WHERE tablename = 'users'
      ORDER BY policyname;
    `);

    if (result.rows.length > 0) {
      console.log('Policies encontradas:');
      result.rows.forEach(row => {
        console.log(`  - ${row.policyname}`);
      });
    } else {
      console.log('⚠️  Nenhuma policy encontrada (verifique no Supabase)');
    }

    console.log('\n✨ RLS fix concluído! Pronto para testar.');
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

executeRLSFix().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
