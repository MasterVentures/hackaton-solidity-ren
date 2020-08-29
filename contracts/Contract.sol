/// SPDX-License-Identifier: LGPL-3.0-or-later

pragma solidity >=0.7.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

interface IGateway {
    function mint(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
    function burn(bytes calldata _to, uint256 _amount) external returns (uint256);
}

interface IGatewayRegistry {
    function getGatewayBySymbol(string calldata _tokenSymbol) external view returns (IGateway);
    function getTokenBySymbol(string calldata _tokenSymbol) external view returns (IERC20);
}

contract Basic {
    IGatewayRegistry public registry;
    
    event Deposit(uint256 _amount, bytes _msg, string indexed symbol);
    event Withdrawal(bytes indexed _to , uint256 _amount, bytes _msg, string indexed symbol);

    constructor(IGatewayRegistry _registry) {
        registry = _registry;
    }
    
    function depositBTC(
        // Parameters from users
        bytes calldata _msg,
        // Parameters from Darknodes
        uint256        _amount,
        bytes32        _nHash,
        bytes calldata _sig
    ) external {
        bytes32 pHash = keccak256(abi.encode(_msg));
        uint256 mintedAmount = registry.getGatewayBySymbol("BTC").mint(pHash, _amount, _nHash, _sig);
        emit Deposit(mintedAmount, _msg, 'BTC');
    }
    
    function depositBCH(
        // Parameters from users
        bytes calldata _msg,
        // Parameters from Darknodes
        uint256        _amount,
        bytes32        _nHash,
        bytes calldata _sig
    ) external {
        bytes32 pHash = keccak256(abi.encode(_msg));
        uint256 mintedAmount = registry.getGatewayBySymbol("BCH").mint(pHash, _amount, _nHash, _sig);
        emit Deposit(mintedAmount, _msg, 'BCH');
    }
    
    function withdrawBTC(bytes calldata _msg, bytes calldata _to, uint256 _amount) external {
        uint256 burnedAmount = registry.getGatewayBySymbol("BTC").burn(_to, _amount);
        emit Withdrawal(_to, burnedAmount, _msg, 'BTC');
    }
    
    function withdrawBCH(bytes calldata _msg, bytes calldata _to, uint256 _amount) external {
        uint256 burnedAmount = registry.getGatewayBySymbol("BCH").burn(_to, _amount);
        emit Withdrawal(_to, burnedAmount, _msg, 'BCH');
    }
    
    function balance(string calldata symbol) public view returns (uint256) {
        return registry.getTokenBySymbol(symbol).balanceOf(address(this));
    }
}