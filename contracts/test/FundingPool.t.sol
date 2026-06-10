// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {FinancingToken} from "../src/FinancingToken.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";
import {FundingPool} from "../src/FundingPool.sol";

contract FundingPoolTest is Test {
    MockUSD usd;
    FinancingToken receipt;
    ReputationOracle oracle;
    FundingPool pool;

    address investor = address(0x1);
    address supplier = address(0x2);
    address debtor = address(0x3);
    address ai = address(0x4);
    address treasury = address(0x5);

    function setUp() public {
        usd = new MockUSD();
        receipt = new FinancingToken();
        oracle = new ReputationOracle();
        pool = new FundingPool(address(usd), address(receipt), address(oracle), treasury, ai);
        receipt.transferOwnership(address(pool));
        oracle.setWriter(address(pool), true);
        usd.mint(investor, 1_000_000);
        usd.mint(debtor, 1_000_000);
    }

    function _fund() internal returns (uint256 id) {
        vm.startPrank(investor);
        usd.approve(address(pool), 100_000);
        id = pool.fund(1, supplier, debtor, 100_000, 110_000, uint64(block.timestamp + 30 days), 2);
        vm.stopPrank();
    }

    function test_fundPaysSupplierAndMintsReceipt() public {
        uint256 id = _fund();
        assertEq(usd.balanceOf(supplier), 99_000); // 1% fee
        assertEq(usd.balanceOf(treasury), 1_000);
        assertEq(receipt.ownerOf(id), investor);
    }

    function test_releaseMilestoneOnlyVerifier() public {
        uint256 id = _fund();
        vm.prank(address(0xBAD));
        vm.expectRevert(FundingPool.NotVerifier.selector);
        pool.releaseMilestone(id);
        vm.prank(ai);
        pool.releaseMilestone(id);
        (,,,, uint8 total, uint8 done) = pool.jobs(id);
        assertEq(done, 1);
        assertEq(total, 2);
        assertEq(oracle.verdicts(ai), 1);
    }

    function test_repayPaysHolder() public {
        uint256 id = _fund();
        vm.startPrank(debtor);
        usd.approve(address(pool), 110_000);
        pool.repay(id);
        vm.stopPrank();
        assertEq(usd.balanceOf(investor), 1_010_000); // -100k advance +110k repay
        assertEq(uint8(receipt.statusOf(id)), uint8(FinancingToken.Status.Repaid));
    }
}
