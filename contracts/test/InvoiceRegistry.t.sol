// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {InvoiceRegistry} from "../src/InvoiceRegistry.sol";

contract InvoiceRegistryTest is Test {
    InvoiceRegistry reg;
    address debtor = address(0xDEB);

    function setUp() public {
        reg = new InvoiceRegistry();
    }

    function test_anchorIncrementsId() public {
        uint256 a = reg.anchor(debtor, 1000, uint64(block.timestamp + 30 days), keccak256("doc1"));
        uint256 b = reg.anchor(debtor, 2000, uint64(block.timestamp + 60 days), keccak256("doc2"));
        assertEq(a, 1);
        assertEq(b, 2);
        assertEq(reg.nextId(), 2);
    }

    function test_anchorStoresFields() public {
        uint64 due = uint64(block.timestamp + 90 days);
        uint256 id = reg.anchor(debtor, 5000, due, keccak256("doc"));
        (address issuer, address d, uint128 face, uint64 dd, bytes32 h) = reg.invoices(id);
        assertEq(issuer, address(this));
        assertEq(d, debtor);
        assertEq(face, 5000);
        assertEq(dd, due);
        assertEq(h, keccak256("doc"));
    }
}
