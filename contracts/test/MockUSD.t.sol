// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockUSD} from "../src/MockUSD.sol";

contract MockUSDTest is Test {
    MockUSD usd;

    function setUp() public {
        usd = new MockUSD();
    }

    function test_metadata() public view {
        assertEq(usd.name(), "Aval Mock USD");
        assertEq(usd.symbol(), "aUSD");
        assertEq(usd.decimals(), 6);
    }

    function test_mint() public {
        usd.mint(address(this), 1_000_000);
        assertEq(usd.balanceOf(address(this)), 1_000_000);
    }

    function test_transfer() public {
        usd.mint(address(this), 500);
        usd.transfer(address(0xB0B), 200);
        assertEq(usd.balanceOf(address(0xB0B)), 200);
        assertEq(usd.balanceOf(address(this)), 300);
    }
}
