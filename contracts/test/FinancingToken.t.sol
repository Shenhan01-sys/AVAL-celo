// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FinancingToken} from "../src/FinancingToken.sol";

contract FinancingTokenTest is Test {
    FinancingToken token;
    address investor = address(0x111);

    function setUp() public {
        token = new FinancingToken();
    }

    function test_mintAssignsOwnership() public {
        uint256 id = token.mint(investor, 7, 1000, uint64(block.timestamp + 30 days));
        assertEq(id, 1);
        assertEq(token.ownerOf(id), investor);
        (uint256 invoiceId,,,) = token.deals(id);
        assertEq(invoiceId, 7);
    }

    function test_setStatus() public {
        uint256 id = token.mint(investor, 7, 1000, uint64(block.timestamp + 30 days));
        token.setStatus(id, FinancingToken.Status.Repaid);
        assertEq(uint8(token.statusOf(id)), uint8(FinancingToken.Status.Repaid));
    }

    function test_onlyOwnerMints() public {
        vm.prank(investor);
        vm.expectRevert();
        token.mint(investor, 1, 1, 1);
    }
}
