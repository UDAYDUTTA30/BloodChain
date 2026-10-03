// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

/**
 * @dev Interface of the ERC-165 standard.
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @dev Implementation of the {IERC165} interface.
 */
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControl {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
    function renounceRole(bytes32 role, address callerConfirmation) external;
}

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms.
 */
abstract contract AccessControl is Context, ERC165, IAccessControl {
    struct RoleData {
        mapping(address => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);
    error AccessControlBadConfirmation();

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }
        _revokeRole(role, callerConfirmation);
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        }
        return false;
    }

    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        }
        return false;
    }

    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

/**
 * @title BloodChain
 * @notice Blockchain-based Blood Supply Chain Traceability & Intelligent Inventory System.
 * @dev Implements the "Blood Unit Passport" lifecycle, OpenZeppelin AccessControl, and document integrity hashes.
 * Remix IDE Ready: Standalone, zero-external-import file for Sepolia deployment.
 */
contract BloodChain is AccessControl, ReentrancyGuard {
    // -------------------------------------------------------------------------
    // Roles Definition
    // -------------------------------------------------------------------------
    bytes32 public constant COLLECTION_ROLE = keccak256("COLLECTION_ROLE");
    bytes32 public constant LAB_ROLE        = keccak256("LAB_ROLE");
    bytes32 public constant BLOOD_BANK_ROLE = keccak256("BLOOD_BANK_ROLE");
    bytes32 public constant HOSPITAL_ROLE   = keccak256("HOSPITAL_ROLE");
    bytes32 public constant AUDITOR_ROLE    = keccak256("AUDITOR_ROLE");

    // -------------------------------------------------------------------------
    // Lifecycle State Machine
    // -------------------------------------------------------------------------
    enum BloodStatus {
        CREATED,      // 0: Intake record initiated
        COLLECTED,    // 1: Blood collected at collection center
        TESTING,      // 2: Under laboratory screening
        APPROVED,     // 3: Tested safe and approved
        REJECTED,     // 4: Failed testing (Terminal)
        STORED,       // 5: Stored in Blood Bank inventory
        TRANSFERRED,  // 6: In-transit to medical facility / hospital
        RECEIVED,     // 7: Acknowledged receipt by destination hospital
        ISSUED,       // 8: Crossmatched and issued for transfusion
        COMPLETED,    // 9: Transfusion complete (Terminal)
        EXPIRED       // 10: Surpassed shelf-life (Terminal / Blocked)
    }

    // -------------------------------------------------------------------------
    // Data Structures
    // -------------------------------------------------------------------------
    struct CustodyRecord {
        address holder;
        BloodStatus status;
        uint256 timestamp;
        string remarks;
    }

    struct BloodUnit {
        string bloodUnitId;        // Globally unique Bag identifier (e.g., BB-2026-001001)
        string donationId;         // Linked donation record
        string bloodGroup;         // A+, A-, B+, B-, AB+, AB-, O+, O-
        string componentType;      // Whole Blood, PRBC, FFP, Platelets
        uint256 collectionTimestamp;
        uint256 expiryTimestamp;
        address currentOwner;      // Responsible facility wallet
        address pendingRecipient;  // Destination facility during transit
        BloodStatus currentStatus;
        bytes32 metadataHash;      // SHA-256 integrity hash of off-chain test/custody report
        bool isRegistered;
    }

    // Storage mappings
    mapping(string => BloodUnit) private _units;
    mapping(string => CustodyRecord[]) private _unitHistory;
    string[] private _allUnitIds;

    // -------------------------------------------------------------------------
    // Events (Full Audit Trail)
    // -------------------------------------------------------------------------
    event BloodUnitRegistered(
        string indexed bloodUnitId,
        string donationId,
        string bloodGroup,
        string componentType,
        uint256 collectionTimestamp,
        uint256 expiryTimestamp,
        address indexed collectionCenter,
        bytes32 metadataHash
    );

    event BloodUnitTestSubmitted(string indexed bloodUnitId, address indexed actor, uint256 timestamp);
    event BloodUnitApproved(string indexed bloodUnitId, address indexed lab, bytes32 testDocHash, uint256 timestamp);
    event BloodUnitRejected(string indexed bloodUnitId, address indexed lab, string reason, uint256 timestamp);
    event BloodUnitStored(string indexed bloodUnitId, address indexed bloodBank, uint256 timestamp);
    event BloodUnitTransferInitiated(string indexed bloodUnitId, address indexed from, address indexed toHospital, uint256 timestamp);
    event BloodUnitTransferConfirmed(string indexed bloodUnitId, address indexed toHospital, uint256 timestamp);
    event BloodUnitIssued(string indexed bloodUnitId, address indexed hospital, bytes32 issueDocHash, uint256 timestamp);
    event BloodUnitCompleted(string indexed bloodUnitId, address indexed hospital, uint256 timestamp);
    event BloodUnitExpired(string indexed bloodUnitId, address indexed detector, uint256 timestamp);
    event MetadataHashUpdated(string indexed bloodUnitId, bytes32 newHash, address indexed updater);
    event LifecycleAnomalyDetected(string indexed bloodUnitId, string reason, address indexed actor, uint256 timestamp);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(address initialAdmin) {
        address admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COLLECTION_ROLE, admin);
        _grantRole(LAB_ROLE, admin);
        _grantRole(BLOOD_BANK_ROLE, admin);
        _grantRole(HOSPITAL_ROLE, admin);
        _grantRole(AUDITOR_ROLE, admin);
    }

    // -------------------------------------------------------------------------
    // Modifiers & Guards
    // -------------------------------------------------------------------------
    modifier unitExists(string memory unitId) {
        require(_units[unitId].isRegistered, "BloodChain: Unit does not exist");
        _;
    }

    modifier notExpired(string memory unitId) {
        if (block.timestamp > _units[unitId].expiryTimestamp) {
            _units[unitId].currentStatus = BloodStatus.EXPIRED;
            emit BloodUnitExpired(unitId, msg.sender, block.timestamp);
            revert("BloodChain: Blood unit has expired and cannot be processed");
        }
        _;
    }

    // -------------------------------------------------------------------------
    // Core Lifecycle Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Registers a new blood unit after donation.
     */
    function registerBloodUnit(
        string calldata bloodUnitId,
        string calldata donationId,
        string calldata bloodGroup,
        string calldata componentType,
        uint256 collectionTimestamp,
        uint256 expiryTimestamp,
        bytes32 metadataHash
    ) external onlyRole(COLLECTION_ROLE) nonReentrant {
        require(bytes(bloodUnitId).length > 0, "BloodChain: Unit ID cannot be empty");
        require(!_units[bloodUnitId].isRegistered, "BloodChain: Unit already registered");
        require(expiryTimestamp > collectionTimestamp, "BloodChain: Expiry must be after collection");
        require(collectionTimestamp <= block.timestamp + 300, "BloodChain: Future collection timestamp invalid");

        BloodUnit storage unit = _units[bloodUnitId];
        unit.bloodUnitId = bloodUnitId;
        unit.donationId = donationId;
        unit.bloodGroup = bloodGroup;
        unit.componentType = componentType;
        unit.collectionTimestamp = collectionTimestamp;
        unit.expiryTimestamp = expiryTimestamp;
        unit.currentOwner = msg.sender;
        unit.pendingRecipient = address(0);
        unit.currentStatus = BloodStatus.COLLECTED;
        unit.metadataHash = metadataHash;
        unit.isRegistered = true;

        _allUnitIds.push(bloodUnitId);

        _recordCustody(bloodUnitId, msg.sender, BloodStatus.COLLECTED, "Donation collected and registered");

        emit BloodUnitRegistered(
            bloodUnitId,
            donationId,
            bloodGroup,
            componentType,
            collectionTimestamp,
            expiryTimestamp,
            msg.sender,
            metadataHash
        );
    }

    /**
     * @notice Submits blood bag for laboratory infectious disease screening.
     */
    function submitForTesting(string calldata bloodUnitId)
        external
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        require(
            hasRole(COLLECTION_ROLE, msg.sender) || hasRole(LAB_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BloodChain: Unauthorized testing submission"
        );
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.COLLECTED, "BloodChain: Invalid state transition for testing");

        unit.currentStatus = BloodStatus.TESTING;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.TESTING, "Submitted for laboratory testing");

        emit BloodUnitTestSubmitted(bloodUnitId, msg.sender, block.timestamp);
    }

    /**
     * @notice Approves unit after all laboratory tests pass safe.
     */
    function approveBloodUnit(string calldata bloodUnitId, bytes32 testDocHash)
        external
        onlyRole(LAB_ROLE)
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.TESTING, "BloodChain: Unit not in testing");

        unit.currentStatus = BloodStatus.APPROVED;
        if (testDocHash != bytes32(0)) {
            unit.metadataHash = testDocHash;
        }

        _recordCustody(bloodUnitId, msg.sender, BloodStatus.APPROVED, "Testing verified: Approved safe");

        emit BloodUnitApproved(bloodUnitId, msg.sender, unit.metadataHash, block.timestamp);
    }

    /**
     * @notice Rejects blood unit due to contamination or failed test markers.
     */
    function rejectBloodUnit(string calldata bloodUnitId, string calldata reason)
        external
        onlyRole(LAB_ROLE)
        unitExists(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.TESTING, "BloodChain: Unit not in testing");

        unit.currentStatus = BloodStatus.REJECTED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.REJECTED, string.concat("Rejected: ", reason));

        emit BloodUnitRejected(bloodUnitId, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Blood bank accepts approved unit into cold-chain storage inventory.
     */
    function storeBloodUnit(string calldata bloodUnitId)
        external
        onlyRole(BLOOD_BANK_ROLE)
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.APPROVED, "BloodChain: Unit must be approved to store");

        unit.currentOwner = msg.sender;
        unit.currentStatus = BloodStatus.STORED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.STORED, "Stocked in blood bank cold storage");

        emit BloodUnitStored(bloodUnitId, msg.sender, block.timestamp);
    }

    /**
     * @notice Initiates custody transfer from Blood Bank to Hospital.
     */
    function initiateTransfer(string calldata bloodUnitId, address toHospital)
        external
        onlyRole(BLOOD_BANK_ROLE)
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        require(toHospital != address(0), "BloodChain: Invalid hospital address");
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.STORED, "BloodChain: Unit must be stored before transfer");
        require(
            unit.currentOwner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BloodChain: Sender is not current custodian"
        );

        unit.pendingRecipient = toHospital;
        unit.currentStatus = BloodStatus.TRANSFERRED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.TRANSFERRED, "Dispatched in transit to hospital");

        emit BloodUnitTransferInitiated(bloodUnitId, msg.sender, toHospital, block.timestamp);
    }

    /**
     * @notice Destination hospital acknowledges receipt and accepts custody.
     */
    function confirmReceipt(string calldata bloodUnitId)
        external
        onlyRole(HOSPITAL_ROLE)
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.TRANSFERRED, "BloodChain: Unit is not in transit");
        require(
            unit.pendingRecipient == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "BloodChain: Only assigned destination hospital can confirm"
        );

        unit.currentOwner = msg.sender;
        unit.pendingRecipient = address(0);
        unit.currentStatus = BloodStatus.RECEIVED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.RECEIVED, "Received and verified by hospital");

        emit BloodUnitTransferConfirmed(bloodUnitId, msg.sender, block.timestamp);
    }

    /**
     * @notice Hospital issues blood unit to patient for transfusion.
     */
    function issueBloodUnit(string calldata bloodUnitId, bytes32 issueDocHash)
        external
        onlyRole(HOSPITAL_ROLE)
        unitExists(bloodUnitId)
        notExpired(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.RECEIVED, "BloodChain: Unit must be in received status to issue");
        require(unit.currentOwner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "BloodChain: Caller not custodian");

        unit.currentStatus = BloodStatus.ISSUED;
        if (issueDocHash != bytes32(0)) {
            unit.metadataHash = issueDocHash;
        }
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.ISSUED, "Issued for patient transfusion");

        emit BloodUnitIssued(bloodUnitId, msg.sender, unit.metadataHash, block.timestamp);
    }

    /**
     * @notice Closes blood unit lifecycle once transfusion successfully completes.
     */
    function completeBloodUnit(string calldata bloodUnitId)
        external
        onlyRole(HOSPITAL_ROLE)
        unitExists(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(unit.currentStatus == BloodStatus.ISSUED, "BloodChain: Unit must be issued before completion");
        require(unit.currentOwner == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "BloodChain: Caller not custodian");

        unit.currentStatus = BloodStatus.COMPLETED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.COMPLETED, "Transfusion complete: Lifecycle closed");

        emit BloodUnitCompleted(bloodUnitId, msg.sender, block.timestamp);
    }

    /**
     * @notice Marks a unit as expired when its expiry date passes.
     */
    function markExpired(string calldata bloodUnitId)
        external
        unitExists(bloodUnitId)
        nonReentrant
    {
        BloodUnit storage unit = _units[bloodUnitId];
        require(block.timestamp > unit.expiryTimestamp, "BloodChain: Unit has not yet reached expiry date");
        require(
            unit.currentStatus != BloodStatus.COMPLETED &&
            unit.currentStatus != BloodStatus.REJECTED &&
            unit.currentStatus != BloodStatus.EXPIRED,
            "BloodChain: Unit is already in a terminal state"
        );

        unit.currentStatus = BloodStatus.EXPIRED;
        _recordCustody(bloodUnitId, msg.sender, BloodStatus.EXPIRED, "Expired: Blocked from further issuance");

        emit BloodUnitExpired(bloodUnitId, msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Verification & Blood Unit Passport Queries
    // -------------------------------------------------------------------------

    /**
     * @notice Retrieves full digital passport data for a blood unit.
     */
    function getBloodUnit(string calldata bloodUnitId)
        external
        view
        unitExists(bloodUnitId)
        returns (
            string memory unitId,
            string memory donationId,
            string memory bloodGroup,
            string memory componentType,
            uint256 collectionTimestamp,
            uint256 expiryTimestamp,
            address currentOwner,
            address pendingRecipient,
            BloodStatus currentStatus,
            bytes32 metadataHash
        )
    {
        BloodUnit storage u = _units[bloodUnitId];
        return (
            u.bloodUnitId,
            u.donationId,
            u.bloodGroup,
            u.componentType,
            u.collectionTimestamp,
            u.expiryTimestamp,
            u.currentOwner,
            u.pendingRecipient,
            u.currentStatus,
            u.metadataHash
        );
    }

    /**
     * @notice Retrieves custody history timeline for the Blood Unit Passport.
     */
    function getBloodUnitHistory(string calldata bloodUnitId)
        external
        view
        unitExists(bloodUnitId)
        returns (CustodyRecord[] memory)
    {
        return _unitHistory[bloodUnitId];
    }

    /**
     * @notice Cryptographically verifies an off-chain document against on-chain metadataHash.
     */
    function verifyMetadataHash(string calldata bloodUnitId, bytes32 hashToVerify)
        external
        view
        unitExists(bloodUnitId)
        returns (bool isMatch)
    {
        return _units[bloodUnitId].metadataHash == hashToVerify;
    }

    /**
     * @notice Safety check verifying if a blood unit is valid and safe for transfusion.
     */
    function isUnitValidForTransfusion(string calldata bloodUnitId)
        external
        view
        unitExists(bloodUnitId)
        returns (bool isValid, string memory reason)
    {
        BloodUnit storage u = _units[bloodUnitId];
        if (block.timestamp > u.expiryTimestamp) {
            return (false, "Unit has expired");
        }
        if (u.currentStatus == BloodStatus.REJECTED) {
            return (false, "Unit failed lab tests and is rejected");
        }
        if (u.currentStatus == BloodStatus.EXPIRED) {
            return (false, "Unit marked expired");
        }
        if (u.currentStatus == BloodStatus.COMPLETED) {
            return (false, "Unit already completed");
        }
        if (u.currentStatus != BloodStatus.RECEIVED && u.currentStatus != BloodStatus.STORED) {
            return (false, "Unit not in valid custody status");
        }
        return (true, "Unit verified safe and valid");
    }

    /**
     * @notice Returns total number of registered blood units.
     */
    function getTotalUnitsCount() external view returns (uint256) {
        return _allUnitIds.length;
    }

    /**
     * @notice Returns a list of all registered unit IDs.
     */
    function getAllUnitIds() external view returns (string[] memory) {
        return _allUnitIds;
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------
    function _recordCustody(
        string memory bloodUnitId,
        address holder,
        BloodStatus status,
        string memory remarks
    ) internal {
        _unitHistory[bloodUnitId].push(CustodyRecord({
            holder: holder,
            status: status,
            timestamp: block.timestamp,
            remarks: remarks
        }));
    }
}
