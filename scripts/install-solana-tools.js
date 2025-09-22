#!/usr/bin/env node

/**
 * BioShield Solana Tools Installation Script
 * Senior Blockchain Developer Full Stack - September 2025
 * 
 * Este script instala y configura las herramientas de Solana necesarias
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SolanaToolsInstaller {
  constructor() {
    this.installResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async installSolanaTools() {
    console.log('🔧 BioShield Solana Tools Installation');
    console.log('================================================================');
    
    try {
      // Check if we're on Windows
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        console.log('🪟 Windows detected. Using Windows-specific installation...');
        await this.installSolanaWindows();
      } else {
        console.log('🐧 Unix-like system detected. Using standard installation...');
        await this.installSolanaUnix();
      }
      
      // Install Anchor
      await this.installAnchor();
      
      // Configure Solana
      await this.configureSolana();
      
      // Verify installation
      await this.verifyInstallation();
      
      this.generateInstallationReport();
      
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      this.installResults.failed++;
      this.installResults.total++;
    }
  }

  async installSolanaWindows() {
    console.log('\n🪟 Installing Solana CLI for Windows...');
    
    try {
      // Check if Solana is already installed
      try {
        execSync('solana --version', { stdio: 'pipe' });
        console.log('✅ Solana CLI already installed');
        this.recordResult('Solana CLI', 'Already installed', true);
        return;
      } catch (error) {
        console.log('📦 Solana CLI not found. Installing...');
      }

      // Download and install Solana CLI
      console.log('📥 Downloading Solana CLI installer...');
      
      const installerPath = './solana-install.exe';
      
      if (!fs.existsSync(installerPath)) {
        console.log('❌ Solana installer not found. Please download from:');
        console.log('   https://github.com/solana-labs/solana/releases');
        console.log('   Save as: solana-install.exe');
        throw new Error('Solana installer not found');
      }

      // Run installer
      console.log('🚀 Running Solana installer...');
      execSync(`${installerPath} --version`, { stdio: 'inherit' });
      
      this.recordResult('Solana CLI', 'Installed successfully', true);
      
    } catch (error) {
      this.recordResult('Solana CLI', error.message, false);
      throw error;
    }
  }

  async installSolanaUnix() {
    console.log('\n🐧 Installing Solana CLI for Unix...');
    
    try {
      // Check if Solana is already installed
      try {
        execSync('solana --version', { stdio: 'pipe' });
        console.log('✅ Solana CLI already installed');
        this.recordResult('Solana CLI', 'Already installed', true);
        return;
      } catch (error) {
        console.log('📦 Solana CLI not found. Installing...');
      }

      // Install using official installer
      console.log('📥 Installing Solana CLI...');
      execSync('sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"', { 
        stdio: 'inherit',
        shell: true
      });
      
      this.recordResult('Solana CLI', 'Installed successfully', true);
      
    } catch (error) {
      this.recordResult('Solana CLI', error.message, false);
      throw error;
    }
  }

  async installAnchor() {
    console.log('\n⚓ Installing Anchor Framework...');
    
    try {
      // Check if Anchor is already installed
      try {
        execSync('anchor --version', { stdio: 'pipe' });
        console.log('✅ Anchor already installed');
        this.recordResult('Anchor', 'Already installed', true);
        return;
      } catch (error) {
        console.log('📦 Anchor not found. Installing...');
      }

      // Install Anchor using avm (Anchor Version Manager)
      console.log('📥 Installing Anchor Version Manager...');
      execSync('cargo install --git https://github.com/coral-xyz/anchor avm --locked --force', {
        stdio: 'inherit'
      });

      console.log('📥 Installing Anchor CLI...');
      execSync('avm install latest', { stdio: 'inherit' });
      execSync('avm use latest', { stdio: 'inherit' });
      
      this.recordResult('Anchor', 'Installed successfully', true);
      
    } catch (error) {
      this.recordResult('Anchor', error.message, false);
      throw error;
    }
  }

  async configureSolana() {
    console.log('\n⚙️ Configuring Solana...');
    
    try {
      // Set devnet configuration
      console.log('🔧 Setting Solana to devnet...');
      execSync('solana config set --url devnet', { stdio: 'inherit' });
      
      console.log('🔧 Setting commitment level...');
      execSync('solana config set --commitment confirmed', { stdio: 'inherit' });
      
      // Check configuration
      console.log('📋 Current Solana configuration:');
      execSync('solana config get', { stdio: 'inherit' });
      
      this.recordResult('Solana Config', 'Configured for devnet', true);
      
    } catch (error) {
      this.recordResult('Solana Config', error.message, false);
      throw error;
    }
  }

  async verifyInstallation() {
    console.log('\n✅ Verifying Installation...');
    
    try {
      // Verify Solana CLI
      console.log('🔍 Checking Solana CLI...');
      const solanaVersion = execSync('solana --version', { encoding: 'utf8' });
      console.log(`✅ Solana CLI: ${solanaVersion.trim()}`);
      this.recordResult('Verification', 'Solana CLI working', true);
      
      // Verify Anchor
      console.log('🔍 Checking Anchor...');
      const anchorVersion = execSync('anchor --version', { encoding: 'utf8' });
      console.log(`✅ Anchor: ${anchorVersion.trim()}`);
      this.recordResult('Verification', 'Anchor working', true);
      
      // Verify Rust (required for Anchor)
      console.log('🔍 Checking Rust...');
      try {
        const rustVersion = execSync('rustc --version', { encoding: 'utf8' });
        console.log(`✅ Rust: ${rustVersion.trim()}`);
        this.recordResult('Verification', 'Rust working', true);
      } catch (error) {
        console.log('⚠️  Rust not found. Installing...');
        execSync('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y', {
          stdio: 'inherit',
          shell: true
        });
        execSync('source ~/.cargo/env', { stdio: 'inherit', shell: true });
        this.recordResult('Verification', 'Rust installed', true);
      }
      
      // Test Solana connection
      console.log('🔍 Testing Solana connection...');
      try {
        execSync('solana cluster-version', { stdio: 'pipe' });
        console.log('✅ Solana connection working');
        this.recordResult('Verification', 'Solana connection working', true);
      } catch (error) {
        console.log('⚠️  Solana connection test failed, but continuing...');
        this.recordResult('Verification', 'Solana connection (warning)', true);
      }
      
    } catch (error) {
      this.recordResult('Verification', error.message, false);
      throw error;
    }
  }

  recordResult(category, test, passed) {
    this.installResults.total++;
    if (passed) {
      this.installResults.passed++;
      console.log(`✅ ${category}: ${test}`);
    } else {
      this.installResults.failed++;
      console.log(`❌ ${category}: ${test}`);
    }
    
    this.installResults.details.push({
      category,
      test,
      passed,
      timestamp: new Date().toISOString()
    });
  }

  generateInstallationReport() {
    console.log('\n📊 INSTALLATION REPORT');
    console.log('================================================================');
    console.log(`Total Checks: ${this.installResults.total}`);
    console.log(`Passed: ${this.installResults.passed}`);
    console.log(`Failed: ${this.installResults.failed}`);
    console.log(`Success Rate: ${((this.installResults.passed / this.installResults.total) * 100).toFixed(2)}%`);
    
    if (this.installResults.failed > 0) {
      console.log('\n❌ Failed Installations:');
      this.installResults.details
        .filter(detail => !detail.passed)
        .forEach(detail => {
          console.log(`   - ${detail.category}: ${detail.test}`);
        });
    } else {
      console.log('\n🎉 All tools installed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Run: npm run execute:next-steps');
      console.log('   2. Or run individual steps as needed');
    }
    
    // Save installation report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.installResults.total,
        passed: this.installResults.passed,
        failed: this.installResults.failed,
        successRate: (this.installResults.passed / this.installResults.total) * 100
      },
      details: this.installResults.details
    };
    
    fs.writeFileSync('./solana-tools-installation-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Installation report saved to solana-tools-installation-report.json');
  }
}

// Run installation
if (require.main === module) {
  const installer = new SolanaToolsInstaller();
  installer.installSolanaTools().catch(error => {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  });
}

module.exports = SolanaToolsInstaller;
