// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {AgentBeacon} from "../src/AgentBeacon.sol";

contract AgentBeaconTest is Test {
    AgentBeacon beacon;
    address agent = address(0xA1);

    function setUp() public {
        beacon = new AgentBeacon();
    }

    function test_deployerIsAgent() public view {
        assertTrue(beacon.isAgent(address(this)));
        assertEq(beacon.owner(), address(this));
    }

    function test_heartbeatIncrementsPulse() public {
        beacon.heartbeat(keccak256("batch-1"));
        beacon.heartbeat(keccak256("batch-2"));
        assertEq(beacon.pulse(), 2);
        assertEq(beacon.lastRef(), keccak256("batch-2"));
    }

    function test_setAgentAllowsHeartbeat() public {
        beacon.setAgent(agent, true);
        vm.prank(agent);
        beacon.heartbeat(keccak256("x"));
        assertEq(beacon.pulse(), 1);
    }

    function test_revertWhenNotAgent() public {
        vm.prank(agent);
        vm.expectRevert(AgentBeacon.NotAgent.selector);
        beacon.heartbeat(keccak256("x"));
    }

    function test_revertWhenNotOwnerSetsAgent() public {
        vm.prank(agent);
        vm.expectRevert(AgentBeacon.NotOwner.selector);
        beacon.setAgent(agent, true);
    }
}
