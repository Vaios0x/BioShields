import { test, expect, Page, Browser } from '@playwright/test';
import { ethers } from 'ethers';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

// Test wallet for E2E testing (never use in production)
const TEST_PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY);

class BioShieldE2EHelper {
  constructor(private page: Page) {}

  async connectWallet() {
    // Navigate to the application
    await this.page.goto(BASE_URL);

    // Wait for the connect wallet button
    await this.page.waitForSelector('[data-testid="connect-wallet-btn"]', { timeout: 10000 });

    // Click connect wallet
    await this.page.click('[data-testid="connect-wallet-btn"]');

    // Select MetaMask (mocked in test environment)
    await this.page.click('[data-testid="metamask-option"]');

    // Wait for wallet connection confirmation
    await this.page.waitForSelector('[data-testid="wallet-connected"]', { timeout: 15000 });

    // Verify wallet address is displayed
    const walletAddress = await this.page.textContent('[data-testid="wallet-address"]');
    expect(walletAddress).toContain(TEST_WALLET.address.slice(0, 6));
  }

  async navigateToCreateCoverage() {
    await this.page.click('[data-testid="create-coverage-nav"]');
    await this.page.waitForSelector('[data-testid="coverage-form"]');
  }

  async fillCoverageForm(options: {
    amount: string;
    period: string;
    coverageType: string;
    payWithLives?: boolean;
    evidenceFile?: string;
  }) {
    // Fill coverage amount
    await this.page.fill('[data-testid="coverage-amount-input"]', options.amount);

    // Select coverage period
    await this.page.selectOption('[data-testid="coverage-period-select"]', options.period);

    // Select coverage type
    await this.page.selectOption('[data-testid="coverage-type-select"]', options.coverageType);

    // Toggle LIVES payment if specified
    if (options.payWithLives) {
      await this.page.check('[data-testid="pay-with-lives-checkbox"]');
    }

    // Upload evidence file if provided
    if (options.evidenceFile) {
      await this.page.setInputFiles('[data-testid="evidence-upload"]', options.evidenceFile);
    }

    // Add trigger conditions
    await this.page.check('[data-testid="clinical-trial-failure-trigger"]');
    await this.page.fill('[data-testid="minimum-threshold-input"]', '10000');
  }

  async submitCoverageForm() {
    // Click submit button
    await this.page.click('[data-testid="submit-coverage-btn"]');

    // Wait for premium calculation
    await this.page.waitForSelector('[data-testid="premium-calculation"]', { timeout: 10000 });

    // Confirm premium and proceed
    await this.page.click('[data-testid="confirm-premium-btn"]');

    // Wait for blockchain transaction confirmation
    await this.page.waitForSelector('[data-testid="transaction-confirmed"]', { timeout: 30000 });
  }

  async navigateToDashboard() {
    await this.page.click('[data-testid="dashboard-nav"]');
    await this.page.waitForSelector('[data-testid="dashboard-container"]');
  }

  async getCoverageCards() {
    return await this.page.locator('[data-testid="coverage-card"]').all();
  }

  async submitClaim(coverageId: string, claimAmount: string, evidenceFile: string) {
    // Find and click the claim button for the specific coverage
    await this.page.click(`[data-testid="submit-claim-btn-${coverageId}"]`);

    // Wait for claim modal
    await this.page.waitForSelector('[data-testid="claim-modal"]');

    // Fill claim form
    await this.page.fill('[data-testid="claim-amount-input"]', claimAmount);
    await this.page.setInputFiles('[data-testid="claim-evidence-upload"]', evidenceFile);
    await this.page.selectOption('[data-testid="claim-type-select"]', 'FULL_COVERAGE');

    // Submit claim
    await this.page.click('[data-testid="submit-claim-modal-btn"]');

    // Wait for submission confirmation
    await this.page.waitForSelector('[data-testid="claim-submitted-confirmation"]', { timeout: 15000 });
  }

  async waitForClaimProcessing(claimId: string, expectedStatus: string, timeout: number = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.page.textContent(`[data-testid="claim-status-${claimId}"]`);

      if (status?.includes(expectedStatus)) {
        return true;
      }

      await this.page.waitForTimeout(5000); // Wait 5 seconds before checking again
      await this.page.reload(); // Refresh to get latest data
    }

    throw new Error(`Claim ${claimId} did not reach status ${expectedStatus} within ${timeout}ms`);
  }

  async getNotificationCount() {
    const badge = await this.page.locator('[data-testid="notification-badge"]');
    if (await badge.isVisible()) {
      return parseInt(await badge.textContent() || '0');
    }
    return 0;
  }

  async openNotificationsPanel() {
    await this.page.click('[data-testid="notifications-bell"]');
    await this.page.waitForSelector('[data-testid="notifications-panel"]');
  }

  async addLiquidity(amount: string, useShieldTokens: boolean = false) {
    // Navigate to liquidity page
    await this.page.click('[data-testid="liquidity-nav"]');
    await this.page.waitForSelector('[data-testid="liquidity-form"]');

    // Fill amount
    await this.page.fill('[data-testid="liquidity-amount-input"]', amount);

    // Toggle SHIELD tokens if specified
    if (useShieldTokens) {
      await this.page.check('[data-testid="use-shield-tokens-checkbox"]');
    }

    // Submit
    await this.page.click('[data-testid="add-liquidity-btn"]');

    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="liquidity-added-confirmation"]', { timeout: 30000 });
  }

  async checkAnalytics() {
    // Navigate to analytics page
    await this.page.click('[data-testid="analytics-nav"]');
    await this.page.waitForSelector('[data-testid="analytics-dashboard"]');

    // Check if charts are loaded
    const charts = await this.page.locator('[data-testid^="chart-"]').all();
    expect(charts.length).toBeGreaterThan(0);

    // Verify key metrics are displayed
    await this.page.waitForSelector('[data-testid="total-tvl"]');
    await this.page.waitForSelector('[data-testid="active-policies"]');
    await this.page.waitForSelector('[data-testid="claims-processed"]');
  }
}

test.describe('BioShield Insurance E2E Tests', () => {
  let helper: BioShieldE2EHelper;

  test.beforeEach(async ({ page }) => {
    helper = new BioShieldE2EHelper(page);

    // Setup test environment
    await page.addInitScript(() => {
      // Mock window.ethereum for testing
      (window as any).ethereum = {
        isMetaMask: true,
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8']; // Test address
          }
          if (params.method === 'eth_chainId') {
            return '0x2105'; // Base mainnet
          }
          if (params.method === 'personal_sign') {
            return '0x' + '0'.repeat(130); // Mock signature
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
  });

  test('Complete Coverage Lifecycle - Creation to Claim Payout', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout for full lifecycle

    // Step 1: Connect wallet
    await helper.connectWallet();

    // Step 2: Create coverage
    await helper.navigateToCreateCoverage();

    await helper.fillCoverageForm({
      amount: '100000',
      period: '365', // 1 year
      coverageType: 'CLINICAL_TRIAL_FAILURE',
      payWithLives: true,
      evidenceFile: './test-files/research-proposal.pdf',
    });

    await helper.submitCoverageForm();

    // Verify coverage creation success
    await expect(page.locator('[data-testid="coverage-created-success"]')).toBeVisible();

    // Step 3: Navigate to dashboard and verify coverage appears
    await helper.navigateToDashboard();

    const coverageCards = await helper.getCoverageCards();
    expect(coverageCards.length).toBe(1);

    // Get coverage ID for later use
    const coverageId = await coverageCards[0].getAttribute('data-coverage-id');
    expect(coverageId).toBeTruthy();

    // Verify coverage details
    await expect(page.locator('[data-testid="coverage-amount"]')).toContainText('$100,000');
    await expect(page.locator('[data-testid="coverage-status"]')).toContainText('Active');

    // Step 4: Submit a claim
    await helper.submitClaim(coverageId!, '50000', './test-files/trial-failure-evidence.pdf');

    // Verify claim submission
    await expect(page.locator('[data-testid="claim-submitted-success"]')).toBeVisible();

    // Step 5: Navigate to claims page and monitor status
    await page.click('[data-testid="claims-nav"]');
    await page.waitForSelector('[data-testid="claims-list"]');

    // Get claim ID
    const claimCards = await page.locator('[data-testid="claim-card"]').all();
    expect(claimCards.length).toBe(1);

    const claimId = await claimCards[0].getAttribute('data-claim-id');
    expect(claimId).toBeTruthy();

    // Verify initial claim status
    await expect(page.locator(`[data-testid="claim-status-${claimId}"]`)).toContainText('Pending');

    // Step 6: Wait for oracle processing (simulated)
    await helper.waitForClaimProcessing(claimId!, 'Under Review', 30000);

    // Step 7: Wait for final approval and payout
    await helper.waitForClaimProcessing(claimId!, 'Approved', 60000);

    // Verify payout was processed
    await expect(page.locator(`[data-testid="payout-amount-${claimId}"]`)).toContainText('$50,000');
    await expect(page.locator(`[data-testid="payout-status-${claimId}"]`)).toContainText('Paid');

    // Step 8: Verify notification was sent
    const notificationCount = await helper.getNotificationCount();
    expect(notificationCount).toBeGreaterThan(0);

    await helper.openNotificationsPanel();
    await expect(page.locator('[data-testid="claim-approved-notification"]')).toBeVisible();

    // Step 9: Check analytics are updated
    await helper.checkAnalytics();

    // Verify metrics are updated
    const totalPaid = await page.textContent('[data-testid="total-claims-paid"]');
    expect(totalPaid).toContain('50,000');
  });

  test('Liquidity Provider Flow', async ({ page }) => {
    test.setTimeout(60000);

    await helper.connectWallet();

    // Add liquidity
    await helper.addLiquidity('10000', false);

    // Navigate to dashboard and verify LP position
    await helper.navigateToDashboard();

    // Check liquidity provider section
    await page.click('[data-testid="lp-positions-tab"]');
    await page.waitForSelector('[data-testid="lp-position-card"]');

    // Verify LP tokens were minted
    const lpBalance = await page.textContent('[data-testid="lp-token-balance"]');
    expect(parseFloat(lpBalance!)).toBeGreaterThan(0);

    // Check APY is displayed
    const apy = await page.textContent('[data-testid="current-apy"]');
    expect(apy).toMatch(/\d+\.\d+%/);

    // Verify can withdraw liquidity
    await page.click('[data-testid="withdraw-liquidity-btn"]');
    await page.waitForSelector('[data-testid="withdraw-modal"]');

    // Withdraw 50% of liquidity
    await page.fill('[data-testid="withdraw-amount-input"]', '5000');
    await page.click('[data-testid="confirm-withdraw-btn"]');

    // Verify withdrawal
    await page.waitForSelector('[data-testid="liquidity-withdrawn-confirmation"]', { timeout: 30000 });
  });

  test('Coverage with Different Risk Profiles', async ({ page }) => {
    test.setTimeout(90000);

    await helper.connectWallet();

    // Test high-risk coverage (Clinical Trial Failure)
    await helper.navigateToCreateCoverage();

    await helper.fillCoverageForm({
      amount: '500000',
      period: '365',
      coverageType: 'CLINICAL_TRIAL_FAILURE',
      payWithLives: false,
    });

    // Check premium calculation for high risk
    await page.click('[data-testid="calculate-premium-btn"]');
    await page.waitForSelector('[data-testid="premium-calculation"]');

    const highRiskPremium = await page.textContent('[data-testid="calculated-premium"]');
    const highRiskAmount = parseFloat(highRiskPremium!.replace(/[,$]/g, ''));

    // Clear form and test low-risk coverage
    await page.click('[data-testid="reset-form-btn"]');

    await helper.fillCoverageForm({
      amount: '500000',
      period: '365',
      coverageType: 'RESEARCH_INFRASTRUCTURE',
      payWithLives: false,
    });

    await page.click('[data-testid="calculate-premium-btn"]');
    await page.waitForSelector('[data-testid="premium-calculation"]');

    const lowRiskPremium = await page.textContent('[data-testid="calculated-premium"]');
    const lowRiskAmount = parseFloat(lowRiskPremium!.replace(/[,$]/g, ''));

    // Verify high-risk premium is higher
    expect(highRiskAmount).toBeGreaterThan(lowRiskAmount);

    // Test LIVES discount
    await page.check('[data-testid="pay-with-lives-checkbox"]');
    await page.click('[data-testid="calculate-premium-btn"]');

    const discountedPremium = await page.textContent('[data-testid="calculated-premium"]');
    const discountedAmount = parseFloat(discountedPremium!.replace(/[,$]/g, ''));

    // Verify 50% discount applied
    expect(discountedAmount).toBeCloseTo(lowRiskAmount * 0.5, 0);
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    test.setTimeout(60000);

    await helper.connectWallet();

    // Test insufficient funds scenario
    await helper.navigateToCreateCoverage();

    await helper.fillCoverageForm({
      amount: '10000000', // Very large amount
      period: '365',
      coverageType: 'CLINICAL_TRIAL_FAILURE',
      payWithLives: true,
    });

    await page.click('[data-testid="submit-coverage-btn"]');

    // Should show insufficient LIVES tokens error
    await expect(page.locator('[data-testid="insufficient-lives-error"]')).toBeVisible();

    // Test invalid coverage parameters
    await page.fill('[data-testid="coverage-amount-input"]', '500'); // Below minimum
    await page.click('[data-testid="submit-coverage-btn"]');

    await expect(page.locator('[data-testid="minimum-coverage-error"]')).toBeVisible();

    // Test network disconnection handling
    await page.evaluate(() => {
      (window as any).ethereum = undefined;
    });

    await page.reload();
    await page.waitForSelector('[data-testid="wallet-disconnected-warning"]');

    // Verify user can reconnect
    await page.evaluate(() => {
      (window as any).ethereum = {
        isMetaMask: true,
        request: async () => ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
        on: () => {},
        removeListener: () => {},
      };
    });

    await helper.connectWallet();
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
  });

  test('Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await helper.connectWallet();

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForSelector('[data-testid="mobile-nav-menu"]');

    await page.click('[data-testid="mobile-create-coverage-nav"]');
    await page.waitForSelector('[data-testid="coverage-form"]');

    // Verify form is properly responsive
    const formWidth = await page.locator('[data-testid="coverage-form"]').boundingBox();
    expect(formWidth!.width).toBeLessThanOrEqual(375);

    // Test touch interactions
    await page.tap('[data-testid="coverage-amount-input"]');
    await page.fill('[data-testid="coverage-amount-input"]', '100000');

    // Verify mobile-optimized components work
    await page.tap('[data-testid="coverage-type-select"]');
    await page.waitForSelector('[data-testid="mobile-select-options"]');
    await page.tap('[data-testid="clinical-trial-option"]');

    // Test swipe gestures on coverage cards (if implemented)
    await helper.navigateToDashboard();

    if (await page.locator('[data-testid="coverage-card"]').count() > 0) {
      const card = page.locator('[data-testid="coverage-card"]').first();
      await card.hover();
      // Test swipe actions would go here
    }
  });

  test('Performance and Load Testing', async ({ page }) => {
    test.setTimeout(120000);

    await helper.connectWallet();

    // Measure page load times
    const startTime = Date.now();
    await helper.navigateToDashboard();
    const dashboardLoadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
    expect(dashboardLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test with multiple coverages (simulate existing data)
    await page.evaluate(() => {
      // Mock multiple coverages in localStorage
      const mockCoverages = Array.from({ length: 20 }, (_, i) => ({
        id: `coverage-${i}`,
        amount: (100000 + i * 10000).toString(),
        status: i % 3 === 0 ? 'EXPIRED' : 'ACTIVE',
        type: 'CLINICAL_TRIAL_FAILURE',
      }));

      localStorage.setItem('mockCoverages', JSON.stringify(mockCoverages));
    });

    await page.reload();

    // Verify pagination works with many items
    await page.waitForSelector('[data-testid="pagination-controls"]');

    // Test pagination performance
    const paginationStartTime = Date.now();
    await page.click('[data-testid="next-page-btn"]');
    await page.waitForSelector('[data-testid="coverage-card"]');
    const paginationTime = Date.now() - paginationStartTime;

    console.log(`Pagination time: ${paginationTime}ms`);
    expect(paginationTime).toBeLessThan(2000); // Should paginate within 2 seconds
  });
});