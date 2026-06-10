// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {InvoiceRegistry} from "../src/InvoiceRegistry.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";
import {FinancingToken} from "../src/FinancingToken.sol";
import {FundingPool} from "../src/FundingPool.sol";
import {AgentBeacon} from "../src/AgentBeacon.sol";

/// @notice Deploys the full AVAL stack and wires the roles.
/// forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address ai = vm.envOr("AGENT_ADDRESS", deployer);
        address treasury = vm.envOr("TREASURY", deployer);

        vm.startBroadcast(pk);
        MockUSD usd = new MockUSD();
        InvoiceRegistry registry = new InvoiceRegistry();
        ReputationOracle oracle = new ReputationOracle();
        FinancingToken receipt = new FinancingToken();
        FundingPool pool = new FundingPool(address(usd), address(receipt), address(oracle), treasury, ai);
        AgentBeacon beacon = new AgentBeacon();

        // wire roles: pool owns the receipt, pool + agent may write reputation, agent may beat
        receipt.transferOwnership(address(pool));
        oracle.setWriter(address(pool), true);
        oracle.setWriter(ai, true);
        if (ai != deployer) beacon.setAgent(ai, true);
        vm.stopBroadcast();

        console.log("MockUSD         ", address(usd));
        console.log("InvoiceRegistry ", address(registry));
        console.log("ReputationOracle", address(oracle));
        console.log("FinancingToken  ", address(receipt));
        console.log("FundingPool     ", address(pool));
        console.log("AgentBeacon     ", address(beacon));
    }
}
