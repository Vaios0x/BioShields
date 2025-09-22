#!/bin/bash

# ============================================================================
# BioShield Insurance - Complete Deployment Script
# ============================================================================

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
NETWORK=""
SKIP_TESTS=false
SKIP_CONTRACTS=false
SKIP_BACKEND=false
SKIP_FRONTEND=false
DRY_RUN=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check required tools
    local tools=("node" "npm" "docker" "kubectl" "git")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    if ! npm version "$node_version" >/dev/null 2>&1; then
        print_error "Node.js version $node_version is not supported. Requires >= $required_version"
        exit 1
    fi

    # Check environment variables
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local required_vars=("DEPLOYER_PRIVATE_KEY" "BASE_RPC_URL" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")
        for var in "${required_vars[@]}"; do
            if [[ -z "${!var:-}" ]]; then
                print_error "Required environment variable $var is not set"
                exit 1
            fi
        done
    fi

    print_success "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment for $ENVIRONMENT..."

    # Create .env file based on environment
    case "$ENVIRONMENT" in
        "testnet")
            cat > .env << EOF
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/bioshield
REDIS_URL=redis://staging-redis:6379
SOLANA_RPC_URL=https://api.devnet.solana.com
BASE_RPC_URL=https://goerli.base.org
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_API_URL=https://api-staging.bioshield.insurance
EOF
            ;;
        "production")
            cat > .env << EOF
NODE_ENV=production
DATABASE_URL=\${DATABASE_URL}
REDIS_URL=\${REDIS_URL}
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://api.bioshield.insurance
EOF
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    print_success "Environment setup complete"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests"
        return
    fi

    print_status "Running comprehensive test suite..."

    # Smart contract tests
    print_status "Running smart contract tests..."
    cd solidity
    npm install
    npx hardhat compile
    npx hardhat test
    npx hardhat coverage
    cd ..

    # Backend tests
    print_status "Running backend tests..."
    cd backend
    npm install
    npx prisma generate
    npm run test
    npm run test:integration
    cd ..

    # Frontend tests
    print_status "Running frontend tests..."
    npm install
    npm run test
    npm run lint
    npm run type-check

    # E2E tests
    print_status "Running E2E tests..."
    npx playwright install
    npm run test:e2e

    print_success "All tests passed"
}

# Function to deploy smart contracts
deploy_contracts() {
    if [[ "$SKIP_CONTRACTS" == "true" ]]; then
        print_warning "Skipping smart contract deployment"
        return
    fi

    print_status "Deploying smart contracts to $NETWORK..."

    cd solidity

    # Check gas prices
    print_status "Checking current gas prices..."
    GAS_PRICE=$(curl -s "https://gasstation.base.org/api" | jq -r '.fast')
    print_status "Current fast gas price: $GAS_PRICE gwei"

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN: Would deploy contracts to $NETWORK"
        cd ..
        return
    fi

    # Deploy contracts
    print_status "Deploying BioShield Insurance contracts..."
    npx hardhat run scripts/deploy.ts --network "$NETWORK"

    # Save deployment addresses
    DEPLOYMENT_FILE="deployments/${NETWORK}.json"
    if [[ -f "$DEPLOYMENT_FILE" ]]; then
        BIOSHIELD_ADDRESS=$(jq -r '.BioShieldInsurance' "$DEPLOYMENT_FILE")
        LIVES_ADDRESS=$(jq -r '.LIVESToken' "$DEPLOYMENT_FILE")
        SHIELD_ADDRESS=$(jq -r '.SHIELDToken' "$DEPLOYMENT_FILE")
        ORACLE_ADDRESS=$(jq -r '.ChainlinkOracle' "$DEPLOYMENT_FILE")

        print_success "Contracts deployed successfully:"
        print_success "  BioShield Insurance: $BIOSHIELD_ADDRESS"
        print_success "  LIVES Token: $LIVES_ADDRESS"
        print_success "  SHIELD Token: $SHIELD_ADDRESS"
        print_success "  Chainlink Oracle: $ORACLE_ADDRESS"

        # Verify contracts on block explorer
        if [[ "$NETWORK" == "base" || "$NETWORK" == "base-goerli" ]]; then
            print_status "Verifying contracts on Basescan..."
            npx hardhat verify --network "$NETWORK" "$BIOSHIELD_ADDRESS"
            npx hardhat verify --network "$NETWORK" "$LIVES_ADDRESS"
            npx hardhat verify --network "$NETWORK" "$SHIELD_ADDRESS"
            npx hardhat verify --network "$NETWORK" "$ORACLE_ADDRESS"
        fi
    else
        print_error "Deployment file not found: $DEPLOYMENT_FILE"
        exit 1
    fi

    cd ..
}

# Function to deploy backend
deploy_backend() {
    if [[ "$SKIP_BACKEND" == "true" ]]; then
        print_warning "Skipping backend deployment"
        return
    fi

    print_status "Deploying backend to $ENVIRONMENT..."

    cd backend

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN: Would deploy backend to $ENVIRONMENT"
        cd ..
        return
    fi

    # Build Docker image
    print_status "Building backend Docker image..."
    docker build -t bioshield-backend:latest .
    docker tag bioshield-backend:latest bioshield-backend:$ENVIRONMENT

    # Push to registry
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker tag bioshield-backend:latest ghcr.io/bioshield/backend:latest
        docker push ghcr.io/bioshield/backend:latest
    fi

    # Deploy to Kubernetes
    case "$ENVIRONMENT" in
        "testnet")
            kubectl apply -f k8s/staging/
            kubectl rollout status deployment/bioshield-backend -n staging --timeout=300s
            ;;
        "production")
            # Blue-green deployment
            kubectl apply -f k8s/production/
            kubectl rollout status deployment/bioshield-backend-green -n production --timeout=600s

            # Run health checks
            print_status "Running health checks..."
            kubectl exec deployment/bioshield-backend-green -n production -- curl -f http://localhost:4000/health

            # Switch traffic
            print_status "Switching traffic to new deployment..."
            kubectl patch service bioshield-backend -n production -p '{"spec":{"selector":{"version":"green"}}}'

            # Cleanup old deployment
            sleep 300  # Wait 5 minutes
            kubectl delete deployment bioshield-backend-blue -n production --ignore-not-found=true
            ;;
    esac

    cd ..
    print_success "Backend deployment complete"
}

# Function to deploy frontend
deploy_frontend() {
    if [[ "$SKIP_FRONTEND" == "true" ]]; then
        print_warning "Skipping frontend deployment"
        return
    fi

    print_status "Deploying frontend to $ENVIRONMENT..."

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN: Would deploy frontend to $ENVIRONMENT"
        return
    fi

    # Build frontend
    print_status "Building frontend..."
    npm run build

    # Deploy based on environment
    case "$ENVIRONMENT" in
        "testnet")
            # Deploy to staging via Vercel
            npx vercel --env preview --token "$VERCEL_TOKEN"
            ;;
        "production")
            # Deploy to production via Vercel
            npx vercel --prod --token "$VERCEL_TOKEN"

            # Update CDN cache
            print_status "Purging CDN cache..."
            curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data '{"purge_everything":true}'
            ;;
    esac

    print_success "Frontend deployment complete"
}

# Function to run post-deployment checks
post_deployment_checks() {
    print_status "Running post-deployment checks..."

    # Wait for services to be ready
    sleep 30

    case "$ENVIRONMENT" in
        "testnet")
            API_URL="https://api-staging.bioshield.insurance"
            APP_URL="https://staging.bioshield.insurance"
            ;;
        "production")
            API_URL="https://api.bioshield.insurance"
            APP_URL="https://app.bioshield.insurance"
            ;;
    esac

    # Health checks
    print_status "Checking API health..."
    if curl -f "$API_URL/health" > /dev/null 2>&1; then
        print_success "API is healthy"
    else
        print_error "API health check failed"
        exit 1
    fi

    print_status "Checking frontend..."
    if curl -f "$APP_URL" > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
        exit 1
    fi

    # Smart contract checks
    if [[ "$SKIP_CONTRACTS" == "false" ]]; then
        print_status "Verifying smart contract deployment..."
        cd solidity
        npx hardhat run scripts/verify-deployment.ts --network "$NETWORK"
        cd ..
    fi

    print_success "All post-deployment checks passed"
}

# Function to send notifications
send_notifications() {
    print_status "Sending deployment notifications..."

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local message="✅ BioShield Insurance deployed to $ENVIRONMENT successfully!"
        if [[ "$ENVIRONMENT" == "production" ]]; then
            message="$message\n🚀 Live at: https://app.bioshield.insurance"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    print_success "Notifications sent"
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed. Starting rollback..."

    case "$ENVIRONMENT" in
        "production")
            # Rollback to blue deployment
            kubectl patch service bioshield-backend -n production -p '{"spec":{"selector":{"version":"blue"}}}'
            kubectl patch service bioshield-frontend -n production -p '{"spec":{"selector":{"version":"blue"}}}'
            ;;
        "testnet")
            # Rollback staging deployment
            kubectl rollout undo deployment/bioshield-backend -n staging
            kubectl rollout undo deployment/bioshield-frontend -n staging
            ;;
    esac

    print_success "Rollback completed"
    exit 1
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] ENVIRONMENT

Deploy BioShield Insurance to specified environment.

ARGUMENTS:
    ENVIRONMENT    Deployment environment (testnet|production)

OPTIONS:
    -n, --network NETWORK     Blockchain network (base-goerli|base)
    --skip-tests             Skip running tests
    --skip-contracts         Skip smart contract deployment
    --skip-backend           Skip backend deployment
    --skip-frontend          Skip frontend deployment
    --dry-run                Show what would be deployed without executing
    -h, --help               Show this help message

EXAMPLES:
    $0 testnet --network base-goerli
    $0 production --network base --skip-tests
    $0 production --dry-run

ENVIRONMENT VARIABLES:
    For production deployment:
    - DEPLOYER_PRIVATE_KEY   Private key for contract deployment
    - BASE_RPC_URL          Base network RPC URL
    - AWS_ACCESS_KEY_ID     AWS access key for Kubernetes
    - AWS_SECRET_ACCESS_KEY AWS secret key for Kubernetes
    - VERCEL_TOKEN          Vercel deployment token
    - CLOUDFLARE_API_TOKEN  Cloudflare API token (optional)
    - SLACK_WEBHOOK_URL     Slack webhook for notifications (optional)

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--network)
            NETWORK="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-contracts)
            SKIP_CONTRACTS=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        testnet|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate arguments
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment is required"
    usage
    exit 1
fi

# Set default network based on environment
if [[ -z "$NETWORK" ]]; then
    case "$ENVIRONMENT" in
        "testnet")
            NETWORK="base-goerli"
            ;;
        "production")
            NETWORK="base"
            ;;
    esac
fi

# Main deployment flow
main() {
    print_status "Starting BioShield Insurance deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Network: $NETWORK"
    print_status "Dry run: $DRY_RUN"

    # Set up error handling
    trap rollback_deployment ERR

    # Deployment steps
    check_prerequisites
    setup_environment
    run_tests
    deploy_contracts
    deploy_backend
    deploy_frontend
    post_deployment_checks
    send_notifications

    print_success "🎉 BioShield Insurance deployment completed successfully!"

    # Display deployment summary
    cat << EOF

📊 Deployment Summary:
======================
Environment: $ENVIRONMENT
Network: $NETWORK
Timestamp: $(date)

🔗 Links:
EOF

    if [[ "$ENVIRONMENT" == "production" ]]; then
        cat << EOF
  • Application: https://app.bioshield.insurance
  • API: https://api.bioshield.insurance
  • Documentation: https://docs.bioshield.insurance
EOF
        if [[ -n "${BIOSHIELD_ADDRESS:-}" ]]; then
            echo "  • Smart Contract: https://basescan.org/address/$BIOSHIELD_ADDRESS"
        fi
    else
        cat << EOF
  • Application: https://staging.bioshield.insurance
  • API: https://api-staging.bioshield.insurance
EOF
        if [[ -n "${BIOSHIELD_ADDRESS:-}" ]]; then
            echo "  • Smart Contract: https://goerli.basescan.org/address/$BIOSHIELD_ADDRESS"
        fi
    fi

    echo ""
    print_success "Deployment completed in $(( SECONDS / 60 )) minutes and $(( SECONDS % 60 )) seconds"
}

# Run main function
main "$@"