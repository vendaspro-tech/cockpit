#!/usr/bin/env node
const { execSync } = require('child_process')

console.log('='.repeat(80))
console.log('🔧 CORREÇÃO COMPLETA DE TODOS OS TESTES')
console.log('='.repeat(80))
console.log('\nBaseado na auditoria completa contra documentação original\n')
console.log('Ordem de execução:')
console.log('  1. DISC - Perfil Comportamental')
console.log('  2. DEF - Método de Avaliação de Calls')
console.log('  3. Senioridade Vendedor + Líder + Estilo Liderança')
console.log('  4. 8 Dimensões de Valores')
console.log('\n' + '='.repeat(80) + '\n')

const scripts = [
  { name: 'DISC', file: 'fix-disc.js' },
  { name: 'DEF', file: 'fix-def.js' },
  { name: 'Senioridade e Liderança', file: 'fix-seniority-and-leadership.js' },
  { name: '8 Dimensões de Valores', file: 'fix-values-8d.js' }
]

let successCount = 0
let failCount = 0

for (const script of scripts) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Executando: ${script.name}`)
  console.log('='.repeat(80))

  try {
    execSync(`node scripts/${script.file}`, { stdio: 'inherit' })
    successCount++
  } catch (error) {
    console.error(`\n❌ ERRO ao executar ${script.name}`)
    console.error(error.message)
    failCount++
  }
}

console.log('\n' + '='.repeat(80))
console.log('📊 RESUMO FINAL')
console.log('='.repeat(80))
console.log(`✅ Sucesso: ${successCount}/${scripts.length}`)
console.log(`❌ Falhas: ${failCount}/${scripts.length}`)

if (failCount === 0) {
  console.log('\n🎉 TODOS OS TESTES CORRIGIDOS COM SUCESSO!')
  console.log('\n📝 Próximos passos:')
  console.log('   1. Fazer hard reload (Ctrl+Shift+R) no navegador')
  console.log('   2. Verificar cada teste na interface de admin')
  console.log('   3. Testar preview de cada estrutura')
  console.log('   4. Criar avaliações de teste para validar')
} else {
  console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.')
  process.exit(1)
}
