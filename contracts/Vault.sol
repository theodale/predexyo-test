// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH} from "./IWETH.sol";

// You cannot use the ERC20 functionality with the WETH address
// (bool success, ) = msg.sender.call{value: msg.value}(""); => does this not work for ?

contract Vault {
    // *** STATE VARIABLES ***

    // Support both reverting and bool-returning ERC20 tokens
    using SafeERC20 for IERC20;

    // Canonical WETH address on Vault's chain
    address immutable WETH;

    // Maps depositor address => their total ETH deposit
    mapping(address => uint256) ETHBalance;

    // Maps depositor address => ERC20 token address => their total deposit of that ERC20
    mapping(address => mapping(address => uint256)) ERC20Balance;

    // *** ERRORS ***

    // Use custom errors to reduce gas from memory writes in require
    error ETHTransferFailure();

    constructor(address _WETH) {
        WETH = _WETH;
    }

    // Allows receiving ETH from WETH
    receive() external payable {}

    // *** ETH DEPOSITS ***

    // Deposits any ETH sent with the call
    function depositETH() external payable {
        ETHBalance[msg.sender] += msg.value;
    }

    // Used by a depositor to withdraw an amount of ETH
    function withdrawETH(uint256 _amount) external payable {
        // Underflow reverts if sender has insufficient deposited ETH
        ETHBalance[msg.sender] -= _amount;

        // Send the ETH to the user using call to offer all available gas to recipeint
        (bool success, ) = msg.sender.call{value: _amount}("");

        if (!success) {
            revert ETHTransferFailure();
        }
    }

    // *** ETH/WETH CONVERSIONS ***

    function swapETHToWETH(uint256 _amount) external {
        // Reverts if sender has insufficient deposited ETH
        ETHBalance[msg.sender] -= _amount;

        // Swap ETH to WETH via its deposit function
        IWETH(WETH).deposit{value: _amount}();

        // Increase the WETH balance of the sender
        ERC20Balance[msg.sender][WETH] += _amount;
    }

    function swapWETHToETH(uint256 _amount) external {
        // Reverts if sender has insufficient deposited WETH
        ERC20Balance[msg.sender][WETH] -= _amount;

        // Swap WETH to ETH via its withdraw function
        IWETH(WETH).withdraw(_amount);

        // // Increase the ETH balance of the sender
        // ETHBalance[msg.sender] += _amount;
    }

    // *** ERC20 DEPOSITS ***

    // Deposit an amount of vault-approved ERC20 tokens
    function depositERC20(address _token, uint256 _amount) external {
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        ERC20Balance[msg.sender][_token] += _amount;
    }

    // Withdraws an amount ERC20 tokens
    function withdrawERC20(address _token, uint256 _amount) external {
        ERC20Balance[msg.sender][_token] -= _amount;

        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
}
