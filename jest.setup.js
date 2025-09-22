// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Solana wallet adapter
jest.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({
    connection: {
      getAccountInfo: jest.fn(),
      getBalance: jest.fn(),
      requestAirdrop: jest.fn(),
    },
  }),
  useWallet: () => ({
    publicKey: null,
    connected: false,
    connecting: false,
    disconnect: jest.fn(),
    sendTransaction: jest.fn(),
  }),
}))

// Mock Anchor
jest.mock('@coral-xyz/anchor', () => ({
  AnchorProvider: jest.fn(),
  Program: jest.fn(),
  web3: {
    Keypair: {
      generate: jest.fn(),
      fromSecretKey: jest.fn(),
    },
    PublicKey: {
      findProgramAddressSync: jest.fn(),
    },
    SystemProgram: {
      programId: 'SystemProgram',
    },
  },
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

// Global test utilities
global.mockSolanaConnection = {
  getAccountInfo: jest.fn(),
  getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
  requestAirdrop: jest.fn().mockResolvedValue('mock-signature'),
}

global.mockWallet = {
  publicKey: null,
  connected: false,
  connecting: false,
  disconnect: jest.fn(),
  sendTransaction: jest.fn().mockResolvedValue('mock-signature'),
}

// Console override for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})