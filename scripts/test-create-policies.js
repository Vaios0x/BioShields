#!/usr/bin/env node

const { createWalletClient, createPublicClient, http, parseAbiItem, parseEther } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

async function testCreatePolicies() {
  console.log('🧪 Probando creación de pólizas en ambos contratos...\n')
  
  const contracts = {
    baseSepolia: {
      chain: baseSepolia,
      rpc: 'https://sepolia.base.org',
      address: '0x01931850d5eb80370a2b8de8e419f638eefd875d',
      name: 'Base Sepolia'
    },
    optimismSepolia: {
      chain: optimismSepolia,
      rpc: 'https://sepolia.optimism.io',
      address: '0x9f6f13a1f3d5929f11911da3dde7a4b903ab9cbf',
      name: 'Optimism Sepolia'
    }
  }

  const privateKey = '0xa664aeeb847952b84144df7b9fdecec732e834fc89487b9e0db11deb26fcceba'
  const account = privateKeyToAccount(privateKey)

  const contractABI = [
    parseAbiItem('function createPolicy(uint256 _coverageAmount, uint256 _premium, string memory _triggerConditions) external payable'),
    parseAbiItem('function createPolicyWithLives(uint256 _coverageAmount, uint256 _premium, string memory _triggerConditions, uint256 _livesAmount) external payable'),
    parseAbiItem('function getPoolStats() view returns (uint256,uint256,uint256,uint256)'),
    parseAbiItem('function getPolicyCount() view returns (uint256)'),
    parseAbiItem('function owner() view returns (address)')
  ]

  for (const [networkKey, network] of Object.entries(contracts)) {
    console.log(`\n🌐 Probando ${network.name}...`)
    console.log(`Address: ${network.address}`)
    
    const client = createPublicClient({
      chain: network.chain,
      transport: http(network.rpc)
    })

    const walletClient = createWalletClient({
      account,
      chain: network.chain,
      transport: http(network.rpc)
    })

    try {
      // Verificar estado inicial
      const initialStats = await client.readContract({
        address: network.address,
        abi: contractABI,
        functionName: 'getPoolStats'
      })
      
      console.log('📊 Estado inicial:', {
        totalPolicies: initialStats[0].toString(),
        totalCoverage: initialStats[1].toString(),
        totalPremiums: initialStats[2].toString(),
        activePolicies: initialStats[3].toString()
      })

      // Parámetros para nueva póliza
      const coverageAmount = 1000000n // $1,000,000
      const premium = 50000n // $50,000
      const triggerConditions = '{"clinicalTrialId":"NCT87654321","dataSource":"clinicaltrials.gov","trialPhase":"Phase III"}'

      console.log('\n🚀 Creando nueva póliza...')
      console.log('📝 Parámetros:', {
        coverageAmount: coverageAmount.toString(),
        premium: premium.toString(),
        triggerConditions: triggerConditions
      })

      // Simular primero
      try {
        await client.simulateContract({
          account: account.address,
          address: network.address,
          abi: contractABI,
          functionName: 'createPolicy',
          args: [coverageAmount, premium, triggerConditions],
          value: premium
        })
        console.log('✅ Simulación exitosa')
      } catch (error) {
        console.log('❌ Simulación falló:', error.message)
        continue
      }

      // Crear póliza real
      const hash = await walletClient.writeContract({
        address: network.address,
        abi: contractABI,
        functionName: 'createPolicy',
        args: [coverageAmount, premium, triggerConditions],
        value: premium
      })

      console.log('⏳ Transaction hash:', hash)
      
      // Esperar confirmación
      const receipt = await client.waitForTransactionReceipt({ hash })
      console.log('✅ Transaction confirmed!')
      console.log('📊 Gas used:', receipt.gasUsed.toString())

      // Verificar estado final
      const finalStats = await client.readContract({
        address: network.address,
        abi: contractABI,
        functionName: 'getPoolStats'
      })
      
      console.log('📊 Estado final:', {
        totalPolicies: finalStats[0].toString(),
        totalCoverage: finalStats[1].toString(),
        totalPremiums: finalStats[2].toString(),
        activePolicies: finalStats[3].toString()
      })

      // Verificar que se creó la póliza
      const policyCount = await client.readContract({
        address: network.address,
        abi: contractABI,
        functionName: 'getPolicyCount'
      })
      
      console.log('📋 Policy Count:', policyCount.toString())

      // Verificar balance del contrato
      const balance = await client.getBalance({ address: network.address })
      console.log('💰 Contract Balance:', balance.toString(), 'wei')

      console.log(`🎉 ¡${network.name} puede crear pólizas correctamente!`)
      console.log(`🔗 Explorer: ${network.chain.blockExplorers?.default?.url}/tx/${hash}`)

    } catch (error) {
      console.log('❌ Error:', error.message)
    }
  }

  console.log('\n💡 CONCLUSIÓN:')
  console.log('Si ambos contratos pueden crear pólizas exitosamente,')
  console.log('el demo funcionará perfectamente con transacciones reales.')
}

testCreatePolicies().catch(console.error)
