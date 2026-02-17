import 'dotenv/config';
import { getSupabaseClient } from '@tracktime/database';

async function testRegistration() {
  const supabase = getSupabaseClient();
  
  const email = `test-${Date.now()}@example.com`;
  const password = 'Test@1234';
  const fullName = 'Test User';

  console.log('📝 Teste de Registro\n');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Full Name: ${fullName}`);
  console.log('');

  try {
    // Step 1: Create auth user
    console.log('1️⃣  Criando usuário de auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('❌ Erro ao criar auth user:', authError);
      return;
    }

    const authId = authData.user?.id;
    console.log(`✅ Auth user criado: ${authId}\n`);

    // Step 2: Insert into public.users
    console.log('2️⃣  Inserindo em public.users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email,
        full_name: fullName,
        phone: null,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao inserir em users:', userError);
      console.error('Mensagem:', userError.message);
      console.error('Código:', userError.code);
      console.error('Detalhes:', userError.details);
      
      // Try to see table structure
      console.log('\n3️⃣  Investigando estrutura da tabela users...');
      const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
        p_table_name: 'users'
      }).catch(() => ({ data: null, error: 'RPC não disponível' }));
      
      if (columns) {
        console.log('Colunas da tabela:', columns);
      } else {
        // Tente uma query simples
        const { data: sample, error: sampleError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        if (!sampleError) {
          console.log('✅ Tabela users é acessível');
        } else {
          console.error('❌ Erro ao acessar users:', sampleError.message);
        }
      }
      return;
    }

    console.log(`✅ Usuário inserido em public.users\n`);
    console.log('Dados inseridos:', userData);
  } catch (err) {
    console.error('Erro não esperado:', err);
  }
}

testRegistration();
