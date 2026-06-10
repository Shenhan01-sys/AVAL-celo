// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSD
/// @notice Testnet settlement stablecoin for AVAL (6 decimals, open mint). On mainnet this is
/// replaced by a real stable (cUSD / USDC). Anyone may mint on testnet to seed demo balances.
contract MockUSD is ERC20 {
    constructor() ERC20("Aval Mock USD", "aUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Open faucet mint for testnet demos.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
