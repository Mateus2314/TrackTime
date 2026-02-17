#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServerAndTests() {
  console.log('🚀 Iniciando servidor da API...\n');

  // Start the server
  const serverProcess = fork(
    join(__dirname, '../dist/index.js'),
    [],
    {
      cwd: join(__dirname, '..'),
      stdio: 'inherit',
      detached: false
    }
  );

  // Wait for server to start
  console.log('⏳ Aguardando servidor iniciar (3 segundos)...\n');
  await sleep(3000);

  // Run tests
  console.log('📝 Executando testes de autenticação...\n');
  const testProcess = spawn('node', ['--test', 'tests/auth.integration.test.mjs'], {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  return new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      console.log('\n🛑 Testes finalizados. Encerrando servidor...\n');
      serverProcess.kill('SIGTERM');
      resolve(code);
    });

    testProcess.on('error', (err) => {
      console.error('Erro ao executar testes:', err);
      serverProcess.kill('SIGTERM');
      reject(err);
    });
  });
}

startServerAndTests()
  .then(code => {
    process.exit(code || 0);
  })
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
