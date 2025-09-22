// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ChainlinkOracle
 * @dev Oracle contract for verifying insurance claims using Chainlink
 * Features:
 * - Clinical trial data verification
 * - Regulatory approval status checking
 * - IP invalidation monitoring
 * - Automated upkeep for periodic checks
 */
contract ChainlinkOracle is
    ChainlinkClient,
    AutomationCompatibleInterface,
    AccessControl,
    ReentrancyGuard,
    Pausable
{
    using Chainlink for Chainlink.Request;

    // ========== CONSTANTS ==========
    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");
    bytes32 public constant INSURANCE_CONTRACT_ROLE = keccak256("INSURANCE_CONTRACT_ROLE");

    // ========== STATE VARIABLES ==========

    // Chainlink configuration
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Price feeds
    mapping(string => AggregatorV3Interface) public priceFeeds;

    // Verification requests
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(bytes32 => bool) public requestFulfilled;
    mapping(bytes32 => VerificationResult) public verificationResults;

    // Data sources
    mapping(string => DataSource) public dataSources;
    mapping(address => bool) public authorizedContracts;

    uint256 public requestCount;
    uint256 public fulfilledCount;

    // ========== STRUCTS ==========

    struct VerificationRequest {
        bytes32 requestId;
        address requester;
        uint256 claimId;
        VerificationType verificationType;
        bytes32 evidenceHash;
        string dataQuery;
        uint256 timestamp;
        bool urgent;
    }

    struct VerificationResult {
        bool isValid;
        uint256 verifiedAmount;
        uint256 confidence;
        string resultData;
        uint256 timestamp;
        bytes32 sourceHash;
    }

    struct DataSource {
        string url;
        string path;
        bool isActive;
        uint256 reliability;
        uint256 lastUpdated;
    }

    // ========== ENUMS ==========

    enum VerificationType {
        ClinicalTrialFailure,
        RegulatoryRejection,
        IpInvalidation,
        ResearchMilestone,
        CustomVerification
    }

    // ========== EVENTS ==========

    event VerificationRequested(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 claimId,
        VerificationType verificationType
    );

    event VerificationCompleted(
        bytes32 indexed requestId,
        bool isValid,
        uint256 verifiedAmount,
        uint256 confidence
    );

    event DataSourceUpdated(
        string indexed name,
        string url,
        bool isActive
    );

    event PriceFeedUpdated(
        string indexed asset,
        address indexed feedAddress
    );

    // ========== MODIFIERS ==========

    modifier onlyAuthorizedContract() {
        require(
            authorizedContracts[msg.sender] || hasRole(INSURANCE_CONTRACT_ROLE, msg.sender),
            "Not authorized contract"
        );
        _;
    }

    modifier validRequestId(bytes32 requestId) {
        require(verificationRequests[requestId].timestamp > 0, "Invalid request ID");
        _;
    }

    // ========== INITIALIZATION ==========

    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) {
        setChainlinkToken(_link);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR_ROLE, msg.sender);

        _initializeDataSources();
    }

    // ========== VERIFICATION FUNCTIONS ==========

    function requestVerification(
        uint256 claimId,
        VerificationType verificationType,
        bytes32 evidenceHash,
        string calldata dataQuery,
        bool urgent
    ) external onlyAuthorizedContract whenNotPaused returns (bytes32) {
        require(LINK.balanceOf(address(this)) >= fee, "Insufficient LINK");

        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillVerification.selector
        );

        // Set request parameters based on verification type
        string memory apiUrl = _getApiUrl(verificationType);
        request.add("get", apiUrl);
        request.add("path", dataQuery);

        // Add evidence hash for verification
        request.addBytes("evidence", abi.encodePacked(evidenceHash));

        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);

        verificationRequests[requestId] = VerificationRequest({
            requestId: requestId,
            requester: msg.sender,
            claimId: claimId,
            verificationType: verificationType,
            evidenceHash: evidenceHash,
            dataQuery: dataQuery,
            timestamp: block.timestamp,
            urgent: urgent
        });

        requestCount++;

        emit VerificationRequested(
            requestId,
            msg.sender,
            claimId,
            verificationType
        );

        return requestId;
    }

    function fulfillVerification(
        bytes32 requestId,
        bool isValid,
        uint256 verifiedAmount,
        uint256 confidence,
        string calldata resultData
    ) external recordChainlinkFulfillment(requestId) {
        require(!requestFulfilled[requestId], "Request already fulfilled");

        verificationResults[requestId] = VerificationResult({
            isValid: isValid,
            verifiedAmount: verifiedAmount,
            confidence: confidence,
            resultData: resultData,
            timestamp: block.timestamp,
            sourceHash: keccak256(abi.encodePacked(resultData))
        });

        requestFulfilled[requestId] = true;
        fulfilledCount++;

        emit VerificationCompleted(
            requestId,
            isValid,
            verifiedAmount,
            confidence
        );

        // Notify insurance contract
        VerificationRequest memory request = verificationRequests[requestId];
        _notifyInsuranceContract(request.requester, requestId);
    }

    // ========== PRICE FEED FUNCTIONS ==========

    function getLatestPrice(string calldata asset)
        external
        view
        returns (int256 price, uint256 timestamp)
    {
        AggregatorV3Interface priceFeed = priceFeeds[asset];
        require(address(priceFeed) != address(0), "Price feed not found");

        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "Invalid price data");
        require(updatedAt > 0, "Price data not updated");

        return (answer, updatedAt);
    }

    function setPriceFeed(string calldata asset, address feedAddress)
        external
        onlyRole(ORACLE_OPERATOR_ROLE)
    {
        require(feedAddress != address(0), "Invalid feed address");
        priceFeeds[asset] = AggregatorV3Interface(feedAddress);

        emit PriceFeedUpdated(asset, feedAddress);
    }

    // ========== AUTOMATION FUNCTIONS ==========

    function checkUpkeep(bytes calldata checkData)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Check for urgent requests that need priority processing
        uint256[] memory urgentRequests = _getUrgentRequests();

        // Check for stale requests that need retry
        uint256[] memory staleRequests = _getStaleRequests();

        upkeepNeeded = urgentRequests.length > 0 || staleRequests.length > 0;
        performData = abi.encode(urgentRequests, staleRequests);
    }

    function performUpkeep(bytes calldata performData) external override {
        (uint256[] memory urgentRequests, uint256[] memory staleRequests) =
            abi.decode(performData, (uint256[], uint256[]));

        // Process urgent requests
        for (uint256 i = 0; i < urgentRequests.length; i++) {
            _retryVerification(bytes32(urgentRequests[i]));
        }

        // Retry stale requests
        for (uint256 i = 0; i < staleRequests.length; i++) {
            _retryVerification(bytes32(staleRequests[i]));
        }
    }

    // ========== DATA SOURCE MANAGEMENT ==========

    function addDataSource(
        string calldata name,
        string calldata url,
        string calldata path,
        uint256 reliability
    ) external onlyRole(ORACLE_OPERATOR_ROLE) {
        require(bytes(name).length > 0, "Invalid name");
        require(bytes(url).length > 0, "Invalid URL");
        require(reliability <= 100, "Invalid reliability");

        dataSources[name] = DataSource({
            url: url,
            path: path,
            isActive: true,
            reliability: reliability,
            lastUpdated: block.timestamp
        });

        emit DataSourceUpdated(name, url, true);
    }

    function updateDataSource(
        string calldata name,
        string calldata url,
        bool isActive
    ) external onlyRole(ORACLE_OPERATOR_ROLE) {
        require(dataSources[name].lastUpdated > 0, "Data source not found");

        dataSources[name].url = url;
        dataSources[name].isActive = isActive;
        dataSources[name].lastUpdated = block.timestamp;

        emit DataSourceUpdated(name, url, isActive);
    }

    // ========== ADMIN FUNCTIONS ==========

    function setOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
    }

    function setJobId(bytes32 _jobId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        jobId = _jobId;
    }

    function setFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fee = _fee;
    }

    function authorizeContract(address contractAddress, bool authorized)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        authorizedContracts[contractAddress] = authorized;

        if (authorized) {
            _grantRole(INSURANCE_CONTRACT_ROLE, contractAddress);
        } else {
            _revokeRole(INSURANCE_CONTRACT_ROLE, contractAddress);
        }
    }

    function withdrawLink()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    function pause() external onlyRole(ORACLE_OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ORACLE_OPERATOR_ROLE) {
        _unpause();
    }

    // ========== INTERNAL FUNCTIONS ==========

    function _initializeDataSources() internal {
        // Clinical Trials
        dataSources["clinicaltrials"] = DataSource({
            url: "https://clinicaltrials.gov/api/v2/studies",
            path: "studies.0.protocolSection.statusModule.overallStatus",
            isActive: true,
            reliability: 95,
            lastUpdated: block.timestamp
        });

        // FDA API
        dataSources["fda"] = DataSource({
            url: "https://api.fda.gov/drug/drugsfda.json",
            path: "results.0.submissions.0.submission_status",
            isActive: true,
            reliability: 98,
            lastUpdated: block.timestamp
        });

        // Patent API
        dataSources["patents"] = DataSource({
            url: "https://api.patentsview.org/patents/query",
            path: "patents.0.patent_status",
            isActive: true,
            reliability: 90,
            lastUpdated: block.timestamp
        });
    }

    function _getApiUrl(VerificationType verificationType)
        internal
        view
        returns (string memory)
    {
        if (verificationType == VerificationType.ClinicalTrialFailure) {
            return dataSources["clinicaltrials"].url;
        } else if (verificationType == VerificationType.RegulatoryRejection) {
            return dataSources["fda"].url;
        } else if (verificationType == VerificationType.IpInvalidation) {
            return dataSources["patents"].url;
        } else {
            return dataSources["clinicaltrials"].url; // Default
        }
    }

    function _notifyInsuranceContract(
        address contractAddress,
        bytes32 requestId
    ) internal {
        // Call back to insurance contract with verification result
        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature(
                "oracleCallback(bytes32)",
                requestId
            )
        );

        // If callback fails, mark for manual processing
        if (!success) {
            // Log for manual intervention
        }
    }

    function _retryVerification(bytes32 requestId) internal {
        VerificationRequest memory request = verificationRequests[requestId];
        if (request.timestamp > 0 && !requestFulfilled[requestId]) {
            // Create new verification request with same parameters
            // Implementation depends on retry strategy
        }
    }

    function _getUrgentRequests() internal view returns (uint256[] memory) {
        // Return array of urgent request IDs that need immediate processing
        uint256[] memory urgent = new uint256[](10);
        uint256 count = 0;

        // Implementation to find urgent requests
        // This is a simplified version

        return urgent;
    }

    function _getStaleRequests() internal view returns (uint256[] memory) {
        // Return array of stale request IDs that need retry
        uint256[] memory stale = new uint256[](10);
        uint256 count = 0;

        // Implementation to find stale requests (older than 1 hour)

        return stale;
    }

    // ========== VIEW FUNCTIONS ==========

    function getVerificationStatus(bytes32 requestId)
        external
        view
        validRequestId(requestId)
        returns (
            bool fulfilled,
            bool isValid,
            uint256 verifiedAmount,
            uint256 confidence
        )
    {
        fulfilled = requestFulfilled[requestId];

        if (fulfilled) {
            VerificationResult memory result = verificationResults[requestId];
            isValid = result.isValid;
            verifiedAmount = result.verifiedAmount;
            confidence = result.confidence;
        }
    }

    function getOracleStats()
        external
        view
        returns (
            uint256 totalRequests,
            uint256 totalFulfilled,
            uint256 successRate,
            uint256 linkBalance
        )
    {
        totalRequests = requestCount;
        totalFulfilled = fulfilledCount;
        successRate = requestCount > 0 ? (fulfilledCount * 100) / requestCount : 0;
        linkBalance = LinkTokenInterface(chainlinkTokenAddress()).balanceOf(address(this));
    }
}