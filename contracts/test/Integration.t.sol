// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";
import {FinancingToken} from "../src/FinancingToken.sol";
import {FundingPool} from "../src/FundingPool.sol";

/// @notice End-to-end: deploy + wire the stack, then run a full financing lifecycle.
contract IntegrationTest is Test {
    address ai = address(0xA1);
    address treasury = address(0x5);
    address investor = address(0x1);
    address supplier = address(0x2);
    address debtor = address(0x3);

    function test_fullLifecycle() public {
        MockUSD usd = new MockUSD();
        ReputationOracle oracle = new ReputationOracle();
        FinancingToken receipt = new FinancingToken();
        FundingPool pool = new FundingPool(address(usd), address(receipt), address(oracle), treasury, ai);
        receipt.transferOwnership(address(pool));
        oracle.setWriter(address(pool), true);
        oracle.setWriter(ai, true);

        usd.mint(investor, 1_000_000);
        usd.mint(debtor, 1_000_000);

        vm.startPrank(investor);
        usd.approve(address(pool), 100_000);
        uint256 id = pool.fund(1, supplier, debtor, 100_000, 110_000, uint64(block.timestamp + 30 days), 2);
        vm.stopPrank();

        vm.startPrank(ai);
        pool.releaseMilestone(id);
        pool.releaseMilestone(id);
        vm.stopPrank();

        vm.startPrank(debtor);
        usd.approve(address(pool), 110_000);
        pool.repay(id);
        vm.stopPrank();

        assertEq(usd.balanceOf(supplier), 99_000);
        assertEq(usd.balanceOf(investor), 1_010_000);
        assertEq(oracle.verdicts(ai), 2);
        assertEq(uint8(receipt.statusOf(id)), uint8(FinancingToken.Status.Repaid));
    }
}
