// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title InvoiceRegistry
/// @notice Anchors invoice commitments on-chain. Each anchor records the issuer (supplier),
/// the debtor, the face value, the due date and a document hash (e.g. IPFS CID hash). Cheap to
/// write — one struct — so anchoring every invoice is a natural source of on-chain activity.
contract InvoiceRegistry {
    struct Invoice {
        address issuer;
        address debtor;
        uint128 faceValue;
        uint64 dueDate;
        bytes32 docHash;
    }

    uint256 public nextId;
    mapping(uint256 => Invoice) public invoices;

    event Anchored(
        uint256 indexed id,
        address indexed issuer,
        address indexed debtor,
        uint128 faceValue,
        uint64 dueDate,
        bytes32 docHash
    );

    /// @notice Anchor a new invoice. Returns its registry id.
    function anchor(address debtor, uint128 faceValue, uint64 dueDate, bytes32 docHash)
        external
        returns (uint256 id)
    {
        id = ++nextId;
        invoices[id] = Invoice(msg.sender, debtor, faceValue, dueDate, docHash);
        emit Anchored(id, msg.sender, debtor, faceValue, dueDate, docHash);
    }

    function issuerOf(uint256 id) external view returns (address) {
        return invoices[id].issuer;
    }
}
