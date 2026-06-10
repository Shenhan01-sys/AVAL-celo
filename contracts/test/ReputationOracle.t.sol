// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";

contract ReputationOracleTest is Test {
    ReputationOracle oracle;
    address agent = address(0xA1);
    address writer = address(0x111);

    function setUp() public {
        oracle = new ReputationOracle();
    }

    function test_stakeAccrues() public {
        vm.deal(agent, 1 ether);
        vm.prank(agent);
        oracle.stake{value: 1 ether}();
        assertEq(oracle.stakeOf(agent), 1 ether);
    }

    function test_writerRecordsAndAccuracy() public {
        oracle.setWriter(writer, true);
        vm.startPrank(writer);
        oracle.recordVerification(agent);
        oracle.recordVerification(agent);
        oracle.recordVerification(agent);
        oracle.recordFault(agent);
        vm.stopPrank();
        assertEq(oracle.verdicts(agent), 3);
        assertEq(oracle.faults(agent), 1);
        assertEq(oracle.accuracyBps(agent), 7500);
    }

    function test_revertNonWriter() public {
        vm.prank(writer);
        vm.expectRevert(ReputationOracle.NotWriter.selector);
        oracle.recordVerification(agent);
    }

    function test_ownerSlashes() public {
        vm.deal(agent, 2 ether);
        vm.prank(agent);
        oracle.stake{value: 2 ether}();
        oracle.slash(agent, 1 ether);
        assertEq(oracle.stakeOf(agent), 1 ether);
    }
}
