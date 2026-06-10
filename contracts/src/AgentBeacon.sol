// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AgentBeacon
/// @notice Gas-only on-chain heartbeat the AVAL verifier agent posts each cycle. Every beat is
/// an attestation of autonomous agent activity (e.g. keccak of the latest verified-invoice
/// batch) — one warm SSTORE plus one event, the cheapest meaningful mainnet transaction.
contract AgentBeacon {
    address public owner;
    mapping(address => bool) public isAgent;
    uint256 public pulse; // total heartbeats posted
    bytes32 public lastRef; // last attestation reference
    uint64 public lastBeat; // timestamp of the last heartbeat

    event Heartbeat(address indexed agent, uint256 indexed pulse, bytes32 ref, uint64 at);
    event AgentSet(address indexed agent, bool allowed);

    error NotOwner();
    error NotAgent();

    constructor() {
        owner = msg.sender;
        isAgent[msg.sender] = true;
        emit AgentSet(msg.sender, true);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Allow or revoke an agent key that may post heartbeats.
    function setAgent(address agent, bool allowed) external onlyOwner {
        isAgent[agent] = allowed;
        emit AgentSet(agent, allowed);
    }

    /// @notice Post a heartbeat. `ref` carries an attestation (e.g. hash of latest verdicts).
    function heartbeat(bytes32 ref) external {
        if (!isAgent[msg.sender]) revert NotAgent();
        unchecked {
            pulse++;
        }
        lastRef = ref;
        lastBeat = uint64(block.timestamp);
        emit Heartbeat(msg.sender, pulse, ref, uint64(block.timestamp));
    }
}
