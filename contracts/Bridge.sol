//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bridge is OwnableUpgradeable, UUPSUpgradeable {
    struct TransferInfo {
        uint256 amount;
        uint256 serviceFee;
        address from;
        string to;
        string targetChain;
        bool isExist;
    }

    mapping(uint256 => TransferInfo) public outboundTransfers;
    mapping(address => bool) public relayers;
    mapping(string => bool) public chains;
    uint256 public nextOutboundTransferId;
    uint256 public nextConfirmOutboundTransferId;
    uint256 public nextInboundTransferId;
    uint256 public serviceFee;
    uint256 public minDeposit;
    address public minaToken;
    bool public frozen;
    uint256 public platformFee;

    event TransferInitiated(
        uint256 indexed transfer_id,
        address indexed from,
        string indexed to,
        uint256 amount,
        string targetChain
    );

    event TokensReleased(
        uint256 indexed transfer_id,
        string indexed from,
        address indexed to,
        uint256 amount
    );

    modifier onlyRelayer() {
        require(
            relayers[msg.sender] == true,
            "Caller is not the registered relayer"
        );
        _;
    }

    modifier isNotFrozen() {
        require(!frozen, "Bridge is frozen by admin");
        _;
    }

    function initialize(
        address _admin,
        address _token,
        uint256 _serviceFee,
        uint256 _platformFee,
        uint256 _minDeposit
    ) public initializer returns (bool) {
        __Ownable_init();
        __UUPSUpgradeable_init();

        minaToken = _token;
        serviceFee = _serviceFee;
        platformFee = _platformFee;
        minDeposit = _minDeposit;

        transferOwnership(_admin);

        return true;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function initiateTransfer(
        string memory to,
        uint256 amount,
        string memory targetChain
    ) public payable isNotFrozen {
        require(chains[targetChain], "Unsupported chain");
        require(msg.value == serviceFee + platformFee, "Missing service fee");
        require(amount >= minDeposit, "Minimum amount required");

        IERC20(minaToken).transferFrom(msg.sender, address(this), amount);

        //set transfer info
        TransferInfo memory transferInfo;
        transferInfo.serviceFee = msg.value;
        transferInfo.amount = amount;
        transferInfo.from = msg.sender;
        transferInfo.to = to;
        transferInfo.targetChain = targetChain;
        transferInfo.isExist = true;
        outboundTransfers[nextOutboundTransferId] = transferInfo;

        emit TransferInitiated(
            nextOutboundTransferId,
            msg.sender,
            to,
            amount,
            targetChain
        );
        nextOutboundTransferId = nextOutboundTransferId + 1;
    }

    function confirmTransfer(uint256 transfer_id) public onlyRelayer isNotFrozen {
        require(
            nextConfirmOutboundTransferId < nextOutboundTransferId,
            "All transfers are confirmed"
        );

        require(
            nextConfirmOutboundTransferId == transfer_id,
            "Invalid transfer id"
        );

        TransferInfo memory transferInfo = outboundTransfers[transfer_id];
        payable(address(msg.sender)).transfer(transferInfo.serviceFee);

        nextConfirmOutboundTransferId = nextConfirmOutboundTransferId + 1;
    }

    function releaseToken(
        uint256 transfer_id,
        string memory from,
        address to,
        uint256 amount
    ) public onlyRelayer isNotFrozen {
        require(transfer_id == nextInboundTransferId, "Invalid transfer id");
        IERC20(minaToken).transfer(to, amount);
        nextInboundTransferId += 1;
        emit TokensReleased(transfer_id, from, to, amount);
    }

    function getBalance(address addr) public view returns (uint256) {
        return addr.balance;
    }

    function forceRegisterRelayer(address _relayer) public onlyOwner {
        relayers[_relayer] = true;
    }

    function forceUnregisterRelayer(address _relayer) public onlyOwner {
        relayers[_relayer] = false;
    }

    function forceRegisterToken(address _token) public onlyOwner {
        minaToken = _token;
    }

    function forceSetServiceFee(uint256 _fee) public onlyOwner {
        serviceFee = _fee;
    }

    function forceSetPlatformFee(uint256 _fee) public onlyOwner {
        platformFee = _fee;
    }

    function forceWithdrawNative(address payable to) public onlyOwner {
        to.transfer(address(this).balance);
    }

    function forceWithdraw(address to) public onlyOwner {
        IERC20(minaToken).transfer(
            to,
            IERC20(minaToken).balanceOf(address(this))
        );
    }

    function forceRegisterChain(string memory chain) public onlyOwner {
        chains[chain] = true;
    }

    function forceUnregisterChain(string memory chain) public onlyOwner {
        chains[chain] = false;
    }

    function forceSetMinDeposit(uint256 amount) public onlyOwner {
        minDeposit = amount;
    }

    function forceFreeze() public onlyOwner {
        frozen = true;
    }

    function forceUnfreeze() public onlyOwner {
        frozen = false;
    }
}

