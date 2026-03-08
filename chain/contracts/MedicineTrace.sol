// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * MedicineTrace
 *  - Stores medicine "master data" (name, batch, mfg/exp dates, etc.)
 *  - Stores a supply-chain history as checkpoints added by authorized participants
 *
 * NOTE: This is a learning / demo contract. For production, prefer:
 *  - store only hashes on-chain and keep large metadata off-chain (e.g., IPFS)
 *  - stronger role model + audit trail + privacy controls
 */
contract MedicineTrace is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant PARTICIPANT_ROLE = keccak256("PARTICIPANT_ROLE");

    struct Medicine {
        string name;
        string batch;
        string manufacturerName; // Human-readable manufacturer name
        uint256 mfgDate;         // Unix timestamp (seconds)
        uint256 expDate;         // Unix timestamp (seconds)
        string metadataURI;      // Optional off-chain URI (IPFS/HTTPS)
        address creator;         // Wallet that created the record
        bool exists;
    }

    struct Checkpoint {
        uint256 timestamp; // block.timestamp
        address actor;     // msg.sender
        string location;   // e.g., "MT Singapore"
        string status;     // e.g., "MANUFACTURED", "SHIPPED", "RECEIVED"
        string notes;      // free-form
    }

    uint256 public nextMedicineId;

    mapping(uint256 => Medicine) private medicines;
    mapping(uint256 => Checkpoint[]) private history;

    event MedicineCreated(
        uint256 indexed medicineId,
        address indexed creator,
        string name,
        string batch
    );

    event CheckpointAdded(
        uint256 indexed medicineId,
        uint256 indexed checkpointIndex,
        address indexed actor,
        string location,
        string status
    );

    error MedicineNotFound(uint256 medicineId);
    error InvalidCheckpointIndex(uint256 medicineId, uint256 index);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        // By default, the deployer/admin can create medicines and add checkpoints.
        _grantRole(MANUFACTURER_ROLE, admin);
        _grantRole(PARTICIPANT_ROLE, admin);
        nextMedicineId = 1;
    }

    function createMedicine(
        string calldata name,
        string calldata batch,
        string calldata manufacturerName,
        uint256 mfgDate,
        uint256 expDate,
        string calldata metadataURI,
        string calldata originLocation
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256 medicineId) {
        medicineId = nextMedicineId++;
        medicines[medicineId] = Medicine({
            name: name,
            batch: batch,
            manufacturerName: manufacturerName,
            mfgDate: mfgDate,
            expDate: expDate,
            metadataURI: metadataURI,
            creator: msg.sender,
            exists: true
        });

        emit MedicineCreated(medicineId, msg.sender, name, batch);

        // Add an initial checkpoint so every medicine starts with a non-empty history.
        history[medicineId].push(Checkpoint({
            timestamp: block.timestamp,
            actor: msg.sender,
            location: originLocation,
            status: "CREATED",
            notes: ""
        }));

        emit CheckpointAdded(medicineId, 0, msg.sender, originLocation, "CREATED");
    }

    function addCheckpoint(
        uint256 medicineId,
        string calldata location,
        string calldata status,
        string calldata notes
    ) external onlyRole(PARTICIPANT_ROLE) {
        if (!medicines[medicineId].exists) revert MedicineNotFound(medicineId);

        history[medicineId].push(Checkpoint({
            timestamp: block.timestamp,
            actor: msg.sender,
            location: location,
            status: status,
            notes: notes
        }));

        uint256 idx = history[medicineId].length - 1;
        emit CheckpointAdded(medicineId, idx, msg.sender, location, status);
    }

    function medicineExists(uint256 medicineId) external view returns (bool) {
        return medicines[medicineId].exists;
    }

    function getMedicine(uint256 medicineId) external view returns (
        string memory name,
        string memory batch,
        string memory manufacturerName,
        uint256 mfgDate,
        uint256 expDate,
        string memory metadataURI,
        address creator
    ) {
        if (!medicines[medicineId].exists) revert MedicineNotFound(medicineId);
        Medicine storage m = medicines[medicineId];
        return (m.name, m.batch, m.manufacturerName, m.mfgDate, m.expDate, m.metadataURI, m.creator);
    }

    function checkpointCount(uint256 medicineId) external view returns (uint256) {
        if (!medicines[medicineId].exists) revert MedicineNotFound(medicineId);
        return history[medicineId].length;
    }

    function getCheckpoint(uint256 medicineId, uint256 index) external view returns (
        uint256 timestamp,
        address actor,
        string memory location,
        string memory status,
        string memory notes
    ) {
        if (!medicines[medicineId].exists) revert MedicineNotFound(medicineId);
        if (index >= history[medicineId].length) revert InvalidCheckpointIndex(medicineId, index);
        Checkpoint storage c = history[medicineId][index];
        return (c.timestamp, c.actor, c.location, c.status, c.notes);
    }
}
