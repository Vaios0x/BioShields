#!/usr/bin/env node

const { createWalletClient, createPublicClient, http, parseAbiItem, parseEther } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

async function testNewContracts() {
  console.log('🧪 Probando los nuevos contratos SimpleBioShield...\n')
  
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
      // Verificar balance
      const balance = await client.getBalance({ address: account.address })
      console.log('💰 Account balance:', balance.toString(), 'wei')

      // ABI para las funciones
      const contractABI = [
        parseAbiItem('function createPolicy(uint256 _coverageAmount, uint256 _premium, string memory _triggerConditions) external payable'),
        parseAbiItem('function createPolicyWithLives(uint256 _coverageAmount, uint256 _premium, string memory _triggerConditions, uint256 _livesAmount) external payable'),
        parseAbiItem('function getPoolStats() view returns (uint256,uint256,uint256,uint256)'),
        parseAbiItem('function getPolicyCount() view returns (uint256)'),
        parseAbiItem('function owner() view returns (address)')
      ]

      // Probar funciones view
      console.log('\n📊 Probando funciones view...')
      
      try {
        const poolStats = await client.readContract({
          address: network.address,
          abi: contractABI,
          functionName: 'getPoolStats'
        })
        console.log('✅ getPoolStats:', {
          totalPolicies: poolStats[0].toString(),
          totalCoverage: poolStats[1].toString(),
          totalPremiums: poolStats[2].toString(),
          activePolicies: poolStats[3].toString()
        })
      } catch (error) {
        console.log('❌ getPoolStats failed:', error.message)
      }

      try {
        const policyCount = await client.readContract({
          address: network.address,
          abi: contractABI,
          functionName: 'getPolicyCount'
        })
        console.log('✅ getPolicyCount:', policyCount.toString())
      } catch (error) {
        console.log('❌ getPolicyCount failed:', error.message)
      }

      try {
        const owner = await client.readContract({
          address: network.address,
          abi: contractABI,
          functionName: 'owner'
        })
        console.log('✅ owner:', owner)
      } catch (error) {
        console.log('❌ owner failed:', error.message)
      }

      // Probar transacción real
      console.log('\n🚀 Probando transacción real...')
      
      const coverageAmount = 500000n
      const premium = 25000n
      const triggerConditions = '{"clinicalTrialId":"NCT12345678","dataSource":"clinicaltrials.gov"}'

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
        console.log('✅ Simulación exitosa - la transacción debería funcionar')
      } catch (error) {
        console.log('❌ Simulación falló:', error.message)
        continue
      }

      // Enviar transacción real
      try {
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

        // Verificar que la póliza se creó
        const newPoolStats = await client.readContract({
          address: network.address,
          abi: contractABI,
          functionName: 'getPoolStats'
        })
        console.log('📊 Pool stats después:', {
          totalPolicies: newPoolStats[0].toString(),
          totalCoverage: newPoolStats[1].toString(),
          totalPremiums: newPoolStats[2].toString(),
          activePolicies: newPoolStats[3].toString()
        })

        console.log(`🎉 ¡${network.name} funciona perfectamente!`)

      } catch (error) {
        console.log('❌ Transacción falló:', error.message)
      }

    } catch (error) {
      console.log('❌ Error general:', error.message)
    }
  }

  console.log('\n💡 CONCLUSIÓN:')
  console.log('Si ambos contratos funcionan, podemos actualizar el código del demo')
  console.log('para usar estas nuevas direcciones y tener transacciones reales.')
}

testNewContracts().catch(console.error)
