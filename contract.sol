// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    struct Item {
        uint id;
        string name;
        uint price; // Price in the smallest unit of the native currency (e.g., wei for ETH/AVAX/MATIC)
        address payable seller;
        address owner;
        bool isSold;
    }

    uint public itemCount = 0;
    mapping(uint => Item) public items;
    mapping(address => uint[]) public ownedItems;

    event ItemListed(uint id, string name, uint price, address seller);
    event ItemPurchased(uint id, address buyer, uint price);
    event ItemTransferred(uint id, address from, address to);

    function listItem(string memory _name, uint _price) public {
        require(_price > 0, "Price must be greater than zero");

        itemCount++;
        items[itemCount] = Item(itemCount, _name, _price, payable(msg.sender), msg.sender, false);
        ownedItems[msg.sender].push(itemCount);

        emit ItemListed(itemCount, _name, _price, msg.sender);
    }

    function purchaseItem(uint _id) public payable {
        Item storage item = items[_id];
        require(_id > 0 && _id <= itemCount, "Item does not exist");
        require(msg.value == item.price, "Incorrect price");
        require(!item.isSold, "Item already sold");
        require(msg.sender != item.seller, "Seller cannot buy their own item");

        item.isSold = true;
        item.seller.transfer(msg.value);

        // Transfer ownership
        _transferOwnership(_id, item.seller, msg.sender);

        emit ItemPurchased(_id, msg.sender, item.price);
    }

    function _transferOwnership(uint _id, address _from, address _to) internal {
        Item storage item = items[_id];
        item.owner = _to;

        // Remove item from the previous owner's list
        uint[] storage fromItems = ownedItems[_from];
        for (uint i = 0; i < fromItems.length; i++) {
            if (fromItems[i] == _id) {
                fromItems[i] = fromItems[fromItems.length - 1];
                fromItems.pop();
                break;
            }
        }

        // Add item to the new owner's list
        ownedItems[_to].push(_id);

        emit ItemTransferred(_id, _from, _to);
    }

    function transferItem(uint _id, address _to) public {
        Item storage item = items[_id];
        require(_id > 0 && _id <= itemCount, "Item does not exist");
        require(msg.sender == item.owner, "You do not own this item");

        _transferOwnership(_id, msg.sender, _to);
    }

    function getItemsByOwner(address _owner) public view returns (uint[] memory) {
        return ownedItems[_owner];
    }

    // Network-specific helper function
    function getNetworkDetails() public view returns (string memory networkName) {
        // Chain IDs for common testnets and mainnets
        if (block.chainid == 43113) {
            return "Avalanche Fuji Testnet";
        } else if (block.chainid == 43114) {
            return "Avalanche C-Chain";
        } else if (block.chainid == 80001) {
            return "Polygon Mumbai Testnet";
        } else if (block.chainid == 137) {
            return "Polygon Mainnet";
        } else if (block.chainid == 59140) {
            return "Linea Testnet";
        } else if (block.chainid == 59144) {
            return "Linea Mainnet";
        } else {
            return "Unknown Network";
        }
    }
}
