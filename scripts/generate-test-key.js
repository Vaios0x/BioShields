#!/usr/bin/env node

const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts')

async function generateTestKey() {
  console.log('🔑 Generando clave privada de prueba...\n')
  
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  
  console.log('🔑 Private Key:', privateKey)
  console.log('👤 Address:', account.address)
  
  console.log('\n💡 Para usar esta clave:')
  console.log('1. Agrega esta clave privada a tu archivo .env como PRIVATE_KEY')
  console.log('2. Asegúrate de tener ETH en esta dirección para deployment')
  console.log('3. Esta es una clave de PRUEBA - NO uses en mainnet')
  
  console.log('\n⚠️  ADVERTENCIA: Esta es una clave de prueba generada localmente')
  console.log('   NO uses esta clave en mainnet o con fondos reales')
}

generateTestKey().catch(console.error)
