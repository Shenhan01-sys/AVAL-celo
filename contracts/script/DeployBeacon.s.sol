// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {AgentBeacon} from "../src/AgentBeacon.sol";

/// @notice Deploys AgentBeacon and optionally authorizes a separate agent key.
/// Usage: forge script script/DeployBeacon.s.sol --rpc-url alfajores --broadcast
contract DeployBeacon is Script {
    function run() external returns (AgentBeacon beacon) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address agent = vm.envOr("AGENT_ADDRESS", address(0));
        vm.startBroadcast(pk);
        beacon = new AgentBeacon();
        if (agent != address(0)) {
            beacon.setAgent(agent, true);
        }
        vm.stopBroadcast();
        console.log("AgentBeacon deployed:", address(beacon));
    }
}
