// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationOracle
/// @notice Economic trust for the AVAL verifier agent (ERC-8004 flavor). Agents stake native
/// value; authorized writers record verdicts and faults; the owner can slash. Accuracy and
/// stake are public so investors can trust verdicts from high-accuracy, well-staked agents.
contract ReputationOracle is Ownable {
    mapping(address => bool) public isWriter;
    mapping(address => uint256) public stakeOf;
    mapping(address => uint256) public verdicts;
    mapping(address => uint256) public faults;

    event Staked(address indexed agent, uint256 amount, uint256 total);
    event WriterSet(address indexed writer, bool allowed);
    event Verified(address indexed agent, uint256 total);
    event Faulted(address indexed agent, uint256 total);
    event Slashed(address indexed agent, uint256 amount);

    error NotWriter();
    error InsufficientStake();

    constructor() Ownable(msg.sender) {}

    modifier onlyWriter() {
        if (!isWriter[msg.sender] && msg.sender != owner()) revert NotWriter();
        _;
    }

    function setWriter(address writer, bool allowed) external onlyOwner {
        isWriter[writer] = allowed;
        emit WriterSet(writer, allowed);
    }

    /// @notice Stake native value behind the caller's verdicts.
    function stake() external payable {
        stakeOf[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value, stakeOf[msg.sender]);
    }

    function recordVerification(address agent) external onlyWriter {
        emit Verified(agent, ++verdicts[agent]);
    }

    function recordFault(address agent) external onlyWriter {
        emit Faulted(agent, ++faults[agent]);
    }

    /// @notice Slash an agent's stake (e.g. proven wrong verdict). The slashed native value
    /// stays locked in the contract as a penalty pool (no external call → no reentrancy).
    function slash(address agent, uint256 amount) external onlyOwner {
        if (stakeOf[agent] < amount) revert InsufficientStake();
        stakeOf[agent] -= amount;
        emit Slashed(agent, amount);
    }

    /// @notice Verdict accuracy in basis points (10000 = 100%).
    function accuracyBps(address agent) external view returns (uint256) {
        uint256 total = verdicts[agent] + faults[agent];
        if (total == 0) return 0;
        return (verdicts[agent] * 10000) / total;
    }
}
