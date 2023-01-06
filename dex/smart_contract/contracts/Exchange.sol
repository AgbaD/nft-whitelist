// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20 {

    address public prytocDevTokenAddress;

    constructor(address _prytocDevToken) ERC20("PrytocDev LP Token", "PDLP") {
        require(_prytocDevToken != address(0), "Token address passed is a null address");
        prytocDevTokenAddress = _prytocDevToken;
    }

    // Get Prytoc Dev token Reserve held by this exchange contract
    function getReserve() public view returns (uint) {
        return ERC20(prytocDevTokenAddress).balanceOf(address(this));
    }

    function addLiquidity(uint _amount) public payable returns (uint) {
        uint prytocDevTokenReserve = getReserve();
        uint ethBalance = address(this).balance;
        uint liquidity;
        ERC20 prytocDevToken = ERC20(prytocDevTokenAddress);

        if (prytocDevTokenReserve == 0) {
            prytocDevToken.transferFrom(msg.sender, address(this), _amount);
            liquidity = ethBalance;
            _mint(msg.sender, liquidity);
        } else {
            uint ethReserve = address(this).balance - msg.value;
            uint prytocDevTokenAmount = (prytocDevTokenReserve * msg.value)/ (ethReserve);
            require(_amount >= prytocDevTokenAmount, "Amount of tokens sent is less than the minimum tokens required");
            prytocDevToken.transferFrom(msg.sender, address(this), _amount);
            liquidity = (totalSupply() * msg.value) / ethReserve;
            _mint(msg.sender, liquidity);
        }
        return liquidity;
    }

    // LP token amount
    function removeLiquidity(uint _amount) public returns (uint, uint) {
        require(_amount > 0, "_amount should be greater than zero");
        require(ERC20(address(this)).balanceOf(msg.sender) >= _amount, "");
        uint ethReserve = address(this).balance;
        uint _totalSupply = totalSupply();
        uint ethAmount = (ethReserve * _amount) / _totalSupply;
        uint prytocDevTokenAmount = (getReserve() * _amount) / _totalSupply;
        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(ethAmount);
        ERC20(prytocDevTokenAddress).transfer(msg.sender, prytocDevTokenAmount);
        return(ethAmount, prytocDevTokenAmount);
    }

    // after removing 1% as fees
    function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint) {
        uint inputAmountWithFee = (99 * inputAmount);
        uint numerator = outputReserve * inputAmountWithFee;
        uint outputAmount = numerator / ((inputReserve * 100 )+ inputAmountWithFee);
        return outputAmount;
    }

    // swap eth for pd token
    function ethToPrytocDevToken(uint _minAmount) public payable {
        uint tokenReserve = getReserve();
        uint tokensBought = getAmountOfTokens(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );
        // eth sent reversal
        // msg.value
        require(tokensBought >= _minAmount, "insufficient output amount");
        ERC20(prytocDevTokenAddress).transfer(msg.sender, tokensBought);
    }

    function prytocDevTokenToEth(uint _tokensSold, uint _minEth) public {
        uint tokenReserve = getReserve();
        uint ethBought = getAmountOfTokens(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );
        require(ethBought >= _minEth, "insufficient eth amount");
        require(ERC20(prytocDevTokenAddress).balanceOf(msg.sender) >= _tokensSold, "User doesn't have enough token to swap");
        ERC20(prytocDevTokenAddress).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );
        payable(msg.sender).transfer(ethBought);
    }
}
