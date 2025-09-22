#!/usr/bin/env node

/**
 * BioShield Next Steps Execution Script (Simplified)
 * Senior Blockchain Developer Full Stack - September 2025
 * 
 * Script simplificado que ejecuta los próximos pasos sin requerir herramientas de Solana
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simplified execution steps
const SIMPLE_STEPS = [
  {
    name: 'Deploy Tokens',
    script: './scripts/deploy-tokens.js',
    description: 'Crear y desplegar los tokens $LIVES y $SHIELD',
    critical: true
  },
  {
    name: 'Run End-to-End Tests',
    script: './tests/end-to-end.test.js',
    description: 'Ejecutar suite completa de tests end-to-end',
    critical: true
  },
  {
    name: 'Prepare Mainnet',
    script: './scripts/prepare-mainnet.js',
    description: 'Preparar configuración para despliegue en mainnet',
    critical: false
  }
];

class SimpleNextStepsExecutor {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    this.startTime = Date.now();
  }

  async executeAllSteps() {
    console.log('🚀 BioShield Next Steps Execution (Simplified)');
    console.log('================================================================');
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`📋 Total steps: ${SIMPLE_STEPS.length}`);
    console.log('');

    // Skip program executable fix for now
    console.log('⏭️  Skipping Program Executable Fix (requires Solana CLI)');
    console.log('   To fix this later, run: npm run install:solana');
    console.log('');

    for (let i = 0; i < SIMPLE_STEPS.length; i++) {
      const step = SIMPLE_STEPS[i];
      console.log(`\n📌 Step ${i + 1}/${SIMPLE_STEPS.length}: ${step.name}`);
      console.log(`📝 Description: ${step.description}`);
      console.log(`🔧 Script: ${step.script}`);
      console.log(`⚠️  Critical: ${step.critical ? 'Yes' : 'No'}`);
      console.log('─'.repeat(80));

      try {
        await this.executeStep(step, i + 1);
        this.results.passed++;
        console.log(`✅ Step ${i + 1} completed successfully`);
      } catch (error) {
        this.results.failed++;
        console.log(`❌ Step ${i + 1} failed: ${error.message}`);
        
        if (step.critical) {
          console.log('🛑 Critical step failed. Stopping execution.');
          break;
        } else {
          console.log('⚠️  Non-critical step failed. Continuing...');
        }
      }
      
      this.results.total++;
      console.log('');
    }

    this.generateExecutionReport();
  }

  async executeStep(step, stepNumber) {
    const startTime = Date.now();
    
    try {
      // Check if script exists
      if (!fs.existsSync(step.script)) {
        throw new Error(`Script not found: ${step.script}`);
      }

      console.log(`🔄 Executing: ${step.script}`);
      
      // Execute the script
      const result = execSync(`node ${step.script}`, { 
        encoding: 'utf8',
        stdio: 'inherit',
        timeout: 300000 // 5 minutes
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  Execution time: ${(duration / 1000).toFixed(2)}s`);
      
      this.results.details.push({
        step: stepNumber,
        name: step.name,
        script: step.script,
        status: 'passed',
        duration: duration,
        timestamp: new Date().toISOString(),
        output: result
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.details.push({
        step: stepNumber,
        name: step.name,
        script: step.script,
        status: 'failed',
        duration: duration,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      
      throw error;
    }
  }

  generateExecutionReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n📊 EXECUTION REPORT');
    console.log('================================================================');
    console.log(`⏰ Total execution time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    console.log(`📋 Total steps: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log(`📈 Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Steps:');
      this.results.details
        .filter(detail => detail.status === 'failed')
        .forEach(detail => {
          console.log(`   ${detail.step}. ${detail.name}: ${detail.error}`);
        });
    }

    // Generate recommendations
    this.generateRecommendations();

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: totalTime,
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: (this.results.passed / this.results.total) * 100
      },
      details: this.results.details
    };

    fs.writeFileSync('./next-steps-simple-execution-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Detailed report saved to next-steps-simple-execution-report.json');
  }

  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('================================================================');

    if (this.results.failed === 0) {
      console.log('🎉 All available steps completed successfully!');
      console.log('');
      console.log('📋 Next Actions:');
      console.log('   1. Install Solana tools: npm run install:solana');
      console.log('   2. Fix program executable: npm run fix:program');
      console.log('   3. Review all generated reports and configurations');
      console.log('   4. Test the application thoroughly in development');
      console.log('   5. Deploy to mainnet when ready');
      console.log('');
      console.log('🔗 Useful Files Generated:');
      console.log('   - token-deployment.json (Token addresses)');
      console.log('   - test-report.json (Test results)');
      console.log('   - mainnet-preparation-report.json (Mainnet readiness)');
      console.log('   - .env.mainnet (Mainnet configuration)');
      console.log('   - MAINNET_DEPLOYMENT_CHECKLIST.md (Deployment guide)');
    } else {
      console.log('⚠️  Some steps failed. Please address the following:');
      console.log('');
      
      const failedSteps = this.results.details.filter(detail => detail.status === 'failed');
      
      failedSteps.forEach(step => {
        console.log(`❌ ${step.name}:`);
        console.log(`   - Error: ${step.error}`);
        console.log(`   - Script: ${step.script}`);
        console.log('');
      });
      
      console.log('🔧 Troubleshooting Tips:');
      console.log('   1. Check that all dependencies are installed');
      console.log('   2. Verify that Node.js is properly installed');
      console.log('   3. Check network connectivity');
      console.log('   4. Review error logs for specific issues');
    }
  }
}

// Utility functions
function checkPrerequisites() {
  console.log('🔍 Checking Prerequisites...');
  
  const checks = [
    {
      name: 'Node.js',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ is required'
    },
    {
      name: 'Package.json',
      check: () => fs.existsSync('./package.json'),
      message: 'package.json not found'
    },
    {
      name: 'Scripts Directory',
      check: () => fs.existsSync('./scripts'),
      message: 'Scripts directory not found'
    }
  ];

  let allPassed = true;
  
  checks.forEach(check => {
    try {
      if (check.check()) {
        console.log(`✅ ${check.name}: OK`);
      } else {
        console.log(`❌ ${check.name}: ${check.message}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      allPassed = false;
    }
  });

  if (!allPassed) {
    console.log('\n❌ Prerequisites check failed. Please fix the issues above before continuing.');
    process.exit(1);
  }

  console.log('✅ All prerequisites met!');
}

// Main execution
async function main() {
  try {
    console.log('🚀 BioShield Next Steps Execution (Simplified)');
    console.log('Senior Blockchain Developer Full Stack - September 2025');
    console.log('================================================================');
    
    // Check prerequisites
    checkPrerequisites();
    
    // Execute all steps
    const executor = new SimpleNextStepsExecutor();
    await executor.executeAllSteps();
    
    // Final status
    if (executor.results.failed === 0) {
      console.log('\n🎉 ALL AVAILABLE STEPS COMPLETED SUCCESSFULLY!');
      console.log('BioShield is now ready for the next phase of development.');
      console.log('\n📋 To complete the full implementation:');
      console.log('   1. Run: npm run install:solana');
      console.log('   2. Run: npm run fix:program');
      console.log('   3. Run: npm run execute:next-steps');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some steps failed. Please review and fix the issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SimpleNextStepsExecutor, SIMPLE_STEPS };
