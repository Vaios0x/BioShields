#!/usr/bin/env node

/**
 * Demo Deployment Script for BioShield Insurance
 * This script prepares the application for demo deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 BioShield Insurance - Demo Deployment Script')
console.log('================================================')

// Configuration for demo deployment
const demoConfig = {
  // Enable demo mode
  NEXT_PUBLIC_DEMO_MODE: 'true',
  NEXT_PUBLIC_MOCK_DATA: 'true',
  
  // Network configuration
  NEXT_PUBLIC_NETWORK: 'devnet',
  NEXT_PUBLIC_SOLANA_RPC: 'https://api.devnet.solana.com',
  
  // Program IDs (demo values)
  NEXT_PUBLIC_PROGRAM_ID: '3WhatnqPNSgXezguJtdugmz5N4LcxzDdbnxrSfpqYu6w',
  NEXT_PUBLIC_INSURANCE_POOL: '11111111111111111111111111111112',
  NEXT_PUBLIC_LIVES_TOKEN: 'DoMbjPNnfThWx89KoX4XrsqPyKuoYSxHf91otU3KnzUz',
  NEXT_PUBLIC_SHIELD_TOKEN: '6ESbK51EppXAvQu5GtyWd9m7jqForjPm8F4fGQrLyKqP',
  
  // Ethereum/Base configuration
  NEXT_PUBLIC_BIOSHIELD_CONTRACT: '0x1234567890123456789012345678901234567890',
  NEXT_PUBLIC_BASE_RPC: 'https://sepolia.base.org',
  NEXT_PUBLIC_OPTIMISM_RPC: 'https://sepolia.optimism.io',
  
  // App configuration
  NEXT_PUBLIC_APP_NAME: 'BioShield Insurance',
  NEXT_PUBLIC_APP_DESCRIPTION: 'Decentralized Insurance for DeSci',
  NEXT_PUBLIC_APP_URL: 'https://bioshield.vercel.app'
}

// Create .env.local file for demo
function createEnvFile() {
  console.log('📝 Creating .env.local file...')
  
  const envContent = Object.entries(demoConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('✅ .env.local file created successfully')
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message)
  }
}

// Update package.json scripts for demo
function updatePackageScripts() {
  console.log('📦 Updating package.json scripts...')
  
  const packagePath = path.join(process.cwd(), 'package.json')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    // Add demo-specific scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'demo:build': 'NEXT_PUBLIC_DEMO_MODE=true npm run build',
      'demo:start': 'NEXT_PUBLIC_DEMO_MODE=true npm run start',
      'demo:dev': 'NEXT_PUBLIC_DEMO_MODE=true npm run dev',
      'demo:deploy': 'npm run demo:build && vercel --prod'
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
    console.log('✅ Package.json scripts updated')
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message)
  }
}

// Create demo deployment info
function createDeploymentInfo() {
  console.log('📋 Creating deployment info...')
  
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    mode: 'demo',
    networks: {
      solana: {
        network: 'devnet',
        programId: demoConfig.NEXT_PUBLIC_PROGRAM_ID,
        rpc: demoConfig.NEXT_PUBLIC_SOLANA_RPC
      },
      ethereum: {
        network: 'base-sepolia',
        contract: demoConfig.NEXT_PUBLIC_BIOSHIELD_CONTRACT,
        rpc: demoConfig.NEXT_PUBLIC_BASE_RPC
      },
      optimism: {
        network: 'optimism-sepolia',
        contract: demoConfig.NEXT_PUBLIC_BIOSHIELD_CONTRACT,
        rpc: demoConfig.NEXT_PUBLIC_OPTIMISM_RPC
      }
    },
    features: {
      mockData: true,
      realTransactions: false,
      oracleIntegration: false,
      crossChain: false,
      aiRiskAssessment: true,
      premiumCalculator: true
    },
    demo: {
      enabled: true,
      scenarios: [
        'clinical_trial_failure',
        'funding_milestone_achievement',
        'ip_application_approval'
      ]
    }
  }
  
  const infoPath = path.join(process.cwd(), 'demo-deployment.json')
  
  try {
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2))
    console.log('✅ Deployment info created')
  } catch (error) {
    console.error('❌ Error creating deployment info:', error.message)
  }
}

// Create demo README
function createDemoReadme() {
  console.log('📖 Creating demo README...')
  
  const readmeContent = `# BioShield Insurance - Demo

## 🚀 Demo Features

This is a demonstration version of BioShield Insurance with the following features:

### ✅ Enabled Features
- **Mock Data**: All data is simulated for demo purposes
- **AI Risk Assessment**: GPT-4 powered risk analysis
- **Premium Calculator**: Dynamic premium calculation
- **Multi-Chain UI**: Support for Solana, Base, and Optimism
- **Token Integration**: $LIVES and $SHIELD token support
- **Wallet Connection**: MetaMask, Phantom, and other wallets

### 🔧 Demo Configuration
- **Network**: Solana Devnet, Base Sepolia, Optimism Sepolia
- **Mode**: Demo mode with mock transactions
- **Data**: Simulated insurance policies and claims
- **Oracles**: Mock oracle data for demonstrations

### 🎯 Demo Scenarios
1. **Clinical Trial Insurance**: Protect against trial failures
2. **Research Funding**: Cover funding milestone risks
3. **IP Protection**: Insure intellectual property applications
4. **Regulatory Compliance**: Cover regulatory submission risks

### 🚀 Running the Demo

\`\`\`bash
# Install dependencies
npm install

# Run in demo mode
npm run demo:dev

# Build for production
npm run demo:build

# Deploy to Vercel
npm run demo:deploy
\`\`\`

### 🔗 Demo Links
- **Live Demo**: https://bioshield.vercel.app
- **GitHub**: https://github.com/bioshield-insurance
- **Documentation**: https://docs.bioshield.vercel.app

### 📱 Supported Wallets
- **Ethereum**: MetaMask, WalletConnect, Coinbase Wallet
- **Solana**: Phantom, Solflare, Backpack
- **Multi-Chain**: Reown AppKit

### 🎨 UI Features
- **Glassmorphism Design**: Modern glass-like interface
- **Neural Animations**: AI-powered visual effects
- **Responsive**: Mobile-first design
- **Accessibility**: WCAG 2.1 compliant
- **Dark Mode**: Built-in dark theme

### 🔒 Security
- **Demo Mode**: All transactions are simulated
- **No Real Funds**: No actual cryptocurrency transactions
- **Safe Testing**: Perfect for demonstrations and testing

---

**Note**: This is a demonstration version. All transactions and data are simulated for demo purposes.
`

  const readmePath = path.join(process.cwd(), 'DEMO_README.md')
  
  try {
    fs.writeFileSync(readmePath, readmeContent)
    console.log('✅ Demo README created')
  } catch (error) {
    console.error('❌ Error creating demo README:', error.message)
  }
}

// Main execution
async function main() {
  try {
    createEnvFile()
    updatePackageScripts()
    createDeploymentInfo()
    createDemoReadme()
    
    console.log('\n🎉 Demo deployment setup completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Run: npm run demo:dev')
    console.log('2. Open: http://localhost:3000')
    console.log('3. Connect your wallet')
    console.log('4. Try the demo features')
    console.log('\n🚀 Ready for DeSci Builders Hackathon!')
    
  } catch (error) {
    console.error('❌ Demo deployment setup failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { demoConfig, createEnvFile, updatePackageScripts }
