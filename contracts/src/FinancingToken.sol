// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title FinancingToken
/// @notice ERC-721 ownership receipt — one token per funded financing, held by the investor and
/// transferable P2P. Minted and status-managed only by the owner (the FundingPool).
contract FinancingToken is ERC721, Ownable {
    enum Status {
        Funded,
        Repaid,
        Defaulted
    }

    struct Deal {
        uint256 invoiceId;
        uint128 nominal;
        uint64 dueDate;
        Status status;
    }

    uint256 public nextId;
    mapping(uint256 => Deal) public deals;

    event Minted(uint256 indexed tokenId, address indexed to, uint256 indexed invoiceId);
    event StatusChanged(uint256 indexed tokenId, Status status);

    constructor() ERC721("Aval Financing Receipt", "aFIN") Ownable(msg.sender) {}

    /// @notice Mint a new financing receipt to `to`. Restricted to the pool (owner).
    function mint(address to, uint256 invoiceId, uint128 nominal, uint64 dueDate)
        external
        onlyOwner
        returns (uint256 id)
    {
        id = ++nextId;
        _mint(to, id);
        deals[id] = Deal(invoiceId, nominal, dueDate, Status.Funded);
        emit Minted(id, to, invoiceId);
    }

    /// @notice Update a deal's lifecycle status. Restricted to the pool (owner).
    function setStatus(uint256 id, Status status) external onlyOwner {
        deals[id].status = status;
        emit StatusChanged(id, status);
    }

    function statusOf(uint256 id) external view returns (Status) {
        return deals[id].status;
    }
}
