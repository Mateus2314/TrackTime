import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeRLSFix() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar configurados no .env');
    process.exit(1);
  }

  // Extract database connection info from Supabase URL
  const urlObj = new URL(supabaseUrl);
  const projectRef = urlObj.hostname.split('.')[0];
  
  // Supabase PostgreSQL connection
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || supabaseServiceKey,
    ssl: { rejectUnauthorized: false },
  });

  console.log('🔧 Executando correção RLS (sem recursão)...\n');
  console.log(`📡 Conectando ao Supabase: ${projectRef}\n`);

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL do Supabase\n');

    // Read SQL file
    const sqlFile = join(__dirname, 'fix-rls-no-recursion.sql');
    const sqlContent = readFileSync(sqlFile, 'utf8');

    // Split by semicolons and filter out empty/comment-only statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`📝 Executando ${statements.length} comandos SQL...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        const result = await client.query(statement);
        
        // Pretty print based on statement type
        if (statement.toUpperCase().includes('SELECT')) {
          console.log(`\n✅ Query ${i + 1}/${statements.length} - Resultados:`);
          if (result.rows && result.rows.length > 0) {
            console.table(result.rows);
          } else {
            console.log('   (sem resultados)');
          }
        } else if (statement.toUpperCase().includes('DROP POLICY')) {
          const match = statement.match(/DROP POLICY.*"([^"]+)"/);
          const policyName = match ? match[1] : 'policy';
          console.log(`✅ ${i + 1}/${statements.length} - Removida policy: ${policyName}`);
        } else if (statement.toUpperCase().includes('CREATE POLICY')) {
          const match = statement.match(/CREATE POLICY.*"([^"]+)"/);
          const policyName = match ? match[1] : 'policy';
          console.log(`✅ ${i + 1}/${statements.length} - Criada policy: ${policyName}`);
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          const match = statement.match(/ALTER TABLE\s+(\S+)/);
          const tableName = match ? match[1] : 'table';
          console.log(`✅ ${i + 1}/${statements.length} - Alterada tabela: ${tableName}`);
        } else {
          console.log(`✅ ${i + 1}/${statements.length} - Executado com sucesso`);
        }
      } catch (err) {
        // Some DROP statements may fail if policy doesn't exist - that's OK
        if (err.message.includes('does not exist')) {
          const match = statement.match(/"([^"]+)"/);
          const name = match ? match[1] : 'item';
          console.log(`⏭️  ${i + 1}/${statements.length} - ${name} (não existia, OK)`);
        } else {
          console.error(`\n❌ Erro no comando ${i + 1}/${statements.length}:`);
          console.error(`   ${statement.substring(0, 100)}...`);
          console.error(`   Erro: ${err.message}\n`);
          // Continue with other statements
        }
      }
    }

    console.log('\n✨ Correção RLS concluída com sucesso!\n');
    console.log('🧪 Agora você pode testar o registro novamente.\n');

  } catch (err) {
    console.error('\n❌ Erro fatal ao executar correção RLS:');
    console.error(err.message);
    console.error('\n💡 Dica: Verifique se:');
    console.error('   1. As credenciais do Supabase estão corretas no .env');
    console.error('   2. Você tem permissões de admin no Supabase');
    console.error('   3. O firewall permite conexão na porta 5432\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeRLSFix().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
