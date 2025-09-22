#!/usr/bin/env node

const { createWalletClient, createPublicClient, http, parseAbiItem, parseEther } = require('viem')
const { optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

async function testRealTransaction() {
  console.log('🧪 Probando transacción real en Optimism Sepolia...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  const privateKey = '0xa664aeeb847952b84144df7b9fdecec732e834fc89487b9e0db11deb26fcceba'
  const account = privateKeyToAccount(privateKey)
  
  console.log('👤 Account:', account.address)
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  const walletClient = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Verificar balance
    const balance = await client.getBalance({ address: account.address })
    console.log('💰 Account balance:', balance.toString(), 'wei')
    
    if (balance < parseEther('0.001')) {
      console.log('❌ Insufficient balance for transaction')
      return
    }

    // ABI para createPolicy
    const createPolicyABI = [
      parseAbiItem('function createPolicy(uint256 _coverageAmount, uint256 _premium, string memory _triggerConditions) external payable')
    ]

    // Parámetros de la transacción
    const coverageAmount = 500000n // $500,000
    const premium = 25000n // $25,000 (en wei)
    const triggerConditions = '{"clinicalTrialId":"NCT12345678","dataSource":"clinicaltrials.gov"}'

    console.log('\n📝 Parámetros de la transacción:')
    console.log('  coverageAmount:', coverageAmount.toString())
    console.log('  premium:', premium.toString())
    console.log('  triggerConditions:', triggerConditions)

    // Simular la transacción primero
    console.log('\n🔍 Simulando transacción...')
    try {
      await client.simulateContract({
        account: account.address,
        address: contractAddress,
        abi: createPolicyABI,
        functionName: 'createPolicy',
        args: [coverageAmount, premium, triggerConditions],
        value: premium
      })
      console.log('✅ Simulación exitosa - la transacción debería funcionar')
    } catch (error) {
      console.log('❌ Simulación falló:', error.message)
      console.log('💡 Esto indica por qué falla la transacción real')
      return
    }

    // Intentar la transacción real
    console.log('\n🚀 Enviando transacción real...')
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: createPolicyABI,
      functionName: 'createPolicy',
      args: [coverageAmount, premium, triggerConditions],
      value: premium
    })

    console.log('⏳ Transaction hash:', hash)
    
    // Esperar confirmación
    const receipt = await client.waitForTransactionReceipt({ hash })
    console.log('✅ Transaction confirmed!')
    console.log('📊 Gas used:', receipt.gasUsed.toString())
    console.log('💰 Effective gas price:', receipt.effectiveGasPrice?.toString())

    // Verificar que la póliza se creó
    console.log('\n🔍 Verificando que la póliza se creó...')
    try {
      const poolStats = await client.readContract({
        address: contractAddress,
        abi: [parseAbiItem('function getPoolStats() view returns (uint256,uint256,uint256,uint256)')],
        functionName: 'getPoolStats'
      })
      console.log('📊 Pool stats después de la transacción:', {
        totalPolicies: poolStats[0].toString(),
        totalCoverage: poolStats[1].toString(),
        totalPremiums: poolStats[2].toString(),
        activePolicies: poolStats[3].toString()
      })
    } catch (error) {
      console.log('❌ Error al verificar pool stats:', error.message)
    }

  } catch (error) {
    console.log('❌ Error:', error.message)
    
    // Analizar el error específico
    if (error.message.includes('execution reverted')) {
      console.log('\n💡 El contrato está revirtiendo la transacción')
      console.log('Posibles causas:')
      console.log('1. Validaciones internas del contrato')
      console.log('2. El contrato está pausado')
      console.log('3. Parámetros inválidos')
      console.log('4. El contrato requiere condiciones específicas')
    }
  }
}

testRealTransaction().catch(console.error)
