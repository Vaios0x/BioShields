/**
 * Script para verificar las variables de entorno
 */

// Cargar variables de entorno
require('dotenv').config()

console.log('🔍 Verificando variables de entorno...\n')

// Verificar variables de Base Sepolia
console.log('🔵 Base Sepolia:')
console.log('NEXT_PUBLIC_BASE_BIOSHIELD_COMPLETE:', process.env.NEXT_PUBLIC_BASE_BIOSHIELD_COMPLETE || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_BASE_BIOSHIELD:', process.env.NEXT_PUBLIC_BASE_BIOSHIELD || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_BASE_LIVES_TOKEN:', process.env.NEXT_PUBLIC_BASE_LIVES_TOKEN || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_BASE_SHIELD_TOKEN:', process.env.NEXT_PUBLIC_BASE_SHIELD_TOKEN || 'NO DEFINIDA')

console.log('\n🟠 Optimism Sepolia:')
console.log('NEXT_PUBLIC_OPTIMISM_BIOSHIELD_COMPLETE:', process.env.NEXT_PUBLIC_OPTIMISM_BIOSHIELD_COMPLETE || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_OPTIMISM_BIOSHIELD:', process.env.NEXT_PUBLIC_OPTIMISM_BIOSHIELD || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_OPTIMISM_LIVES_TOKEN:', process.env.NEXT_PUBLIC_OPTIMISM_LIVES_TOKEN || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_OPTIMISM_SHIELD_TOKEN:', process.env.NEXT_PUBLIC_OPTIMISM_SHIELD_TOKEN || 'NO DEFINIDA')

console.log('\n🔧 Configuración:')
console.log('NEXT_PUBLIC_DEMO_MODE:', process.env.NEXT_PUBLIC_DEMO_MODE || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_MOCK_DATA:', process.env.NEXT_PUBLIC_MOCK_DATA || 'NO DEFINIDA')

console.log('\n📡 RPC URLs:')
console.log('NEXT_PUBLIC_BASE_RPC:', process.env.NEXT_PUBLIC_BASE_RPC || 'NO DEFINIDA')
console.log('NEXT_PUBLIC_OPTIMISM_RPC:', process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'NO DEFINIDA')

console.log('\n✅ Verificación completada!')
