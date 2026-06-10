// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FinancingToken} from "./FinancingToken.sol";
import {ReputationOracle} from "./ReputationOracle.sol";

/// @title FundingPool
/// @notice Escrow + lifecycle for AVAL financings (ERC-8183 job flavor). An investor funds an
/// invoice (cash to the supplier today) and receives an ERC-721 receipt; the AI verifier
/// releases milestones (earning reputation); the debtor repays the nominal to the receipt
/// holder at maturity. Must own FinancingToken and be a ReputationOracle writer.
contract FundingPool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usd;
    FinancingToken public immutable receipt;
    ReputationOracle public immutable oracle;
    address public treasury;
    address public aiVerifier;
    uint16 public feeBps = 100; // 1%

    struct Job {
        address supplier;
        address debtor;
        uint128 advance;
        uint128 nominal;
        uint8 milestonesTotal;
        uint8 milestonesDone;
    }

    mapping(uint256 => Job) public jobs; // keyed by receipt tokenId

    event Funded(
        uint256 indexed tokenId, address indexed investor, address indexed supplier, uint128 advance, uint128 nominal
    );
    event MilestoneReleased(uint256 indexed tokenId, uint8 done, uint8 total);
    event Repaid(uint256 indexed tokenId, address indexed payer, uint128 nominal);

    error NotVerifier();
    error AlreadyComplete();

    constructor(address _usd, address _receipt, address _oracle, address _treasury, address _ai) Ownable(msg.sender) {
        usd = IERC20(_usd);
        receipt = FinancingToken(_receipt);
        oracle = ReputationOracle(_oracle);
        treasury = _treasury;
        aiVerifier = _ai;
    }

    function setAiVerifier(address a) external onlyOwner {
        aiVerifier = a;
    }

    function setFeeBps(uint16 bps) external onlyOwner {
        feeBps = bps;
    }

    /// @notice Investor funds an invoice: pays the supplier the advance (minus fee) now and
    /// receives an ERC-721 receipt. Requires prior aUSD approval for `advance`.
    function fund(
        uint256 invoiceId,
        address supplier,
        address debtor,
        uint128 advance,
        uint128 nominal,
        uint64 dueDate,
        uint8 milestones
    ) external returns (uint256 tokenId) {
        usd.safeTransferFrom(msg.sender, address(this), advance);
        uint256 fee = (uint256(advance) * feeBps) / 10000;
        usd.safeTransfer(supplier, advance - fee);
        if (fee > 0) usd.safeTransfer(treasury, fee);
        tokenId = receipt.mint(msg.sender, invoiceId, nominal, dueDate);
        jobs[tokenId] = Job(supplier, debtor, advance, nominal, milestones, 0);
        emit Funded(tokenId, msg.sender, supplier, advance, nominal);
    }

    /// @notice AI verifier releases one milestone and earns a reputation verdict.
    function releaseMilestone(uint256 tokenId) external {
        if (msg.sender != aiVerifier) revert NotVerifier();
        Job storage j = jobs[tokenId];
        if (j.milestonesDone >= j.milestonesTotal) revert AlreadyComplete();
        j.milestonesDone++;
        oracle.recordVerification(aiVerifier);
        emit MilestoneReleased(tokenId, j.milestonesDone, j.milestonesTotal);
    }

    /// @notice Debtor repays the nominal to the current receipt holder at maturity.
    function repay(uint256 tokenId) external {
        Job storage j = jobs[tokenId];
        address holder = receipt.ownerOf(tokenId);
        usd.safeTransferFrom(msg.sender, holder, j.nominal);
        receipt.setStatus(tokenId, FinancingToken.Status.Repaid);
        emit Repaid(tokenId, msg.sender, j.nominal);
    }
}
