// Runner: Executar todos os testes da Fase 2
const { execSync } = require('child_process')
const path = require('path')

const tests = [
  { name: 'Job Titles CRUD', file: 'job-titles.test.js' },
  { name: 'Competency Frameworks CRUD', file: 'competency-frameworks.test.js' },
  { name: 'Test Structures Editor', file: 'test-structures.test.js' }
]

let totalPass = 0
let totalFail = 0

console.log('\n╔═══════════════════════════════════════════════════════════╗')
console.log('║        FASE 2 - SUITE COMPLETA DE TESTES                   ║')
console.log('╚═══════════════════════════════════════════════════════════╝\n')

const testDir = __dirname

for (const test of tests) {
  console.log(`\n▶️  Executando: ${test.name}`)
  console.log('─'.repeat(60))

  try {
    // Executar teste e capturar saída
    const output = execSync(`node "${path.join(testDir, test.file)}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    // Mostrar saída
    console.log(output)

    // Parse output for pass/fail counts
    const lines = output.split('\n')
    const passLine = lines.find(l => l.includes('✅ Passou:'))
    const failLine = lines.find(l => l.includes('❌ Falhou:'))

    if (passLine) {
      const match = passLine.match(/✅ Passou:\s*(\d+)/)
      if (match) totalPass += parseInt(match[1])
    }

    if (failLine) {
      const match = failLine.match(/❌ Falhou:\s*(\d+)/)
      if (match) totalFail += parseInt(match[1])
    }
  } catch (error) {
    console.error(`\n❌ Erro ao executar ${test.name}:`, error.message)
    totalFail++
  }
}

console.log('\n╔═══════════════════════════════════════════════════════════╗')
console.log('║                    RESUMO GERAL                            ║')
console.log('╚═══════════════════════════════════════════════════════════╝')
console.log(`\n✅ Total Passou: ${totalPass}`)
console.log(`❌ Total Falhou: ${totalFail}`)
console.log(`📊 Total Testes: ${totalPass + totalFail}`)
console.log(`📈 Taxa de Sucesso: ${((totalPass / (totalPass + totalFail)) * 100).toFixed(1)}%`)

if (totalFail === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! Fase 2 está validada.\n')
  process.exit(0)
} else {
  console.log('\n⚠️  Alguns testes falharam. Revise os erros acima.\n')
  process.exit(1)
}
