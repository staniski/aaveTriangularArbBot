pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "./aave/FlashLoanReceiverBase.sol";
import "./aave/ILendingPoolAddressesProvider.sol";
import "./aave/ILendingPool.sol";

interface ISimpleKyberProxy {
    function swapTokenToEther(
        IERC20 token,
        uint256 srcAmount,
        uint256 minConversionRate
    ) external returns (uint256 destAmount);

    function swapEtherToToken(IERC20 token, uint256 minConversionRate)
        external
        payable
        returns (uint256 destAmount);

    function swapTokenToToken(
        IERC20 src,
        uint256 srcAmount,
        IERC20 dest,
        uint256 minConversionRate
    ) external returns (uint256 destAmount);
}


interface UniswapV2Router02 {
    
    function WETH() external pure returns (address);
     
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
      external
      payable
    returns (uint[] memory amounts);
    
  function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
      external
      returns (uint[] memory amounts);
      
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}


contract Flashloan is FlashLoanReceiverBase{
    
    address ETH_TOKEN_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    
    
    
    UniswapV2Router02 uniswap;
    ISimpleKyberProxy kyber;
   
   
    
    
   constructor(
      address _addressProvider,
        address uniswapAddress,
        address kyberAddress
        ) FlashLoanReceiverBase(_addressProvider)
        public{
      
    uniswap = UniswapV2Router02(uniswapAddress);
    kyber = ISimpleKyberProxy(kyberAddress);
    
    
    
     
      
      
    }
    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    )
        override
        external
    {
        require(_amount <= getBalanceInternal(address(this), _reserve), "Invalid balance, was the flashLoan successful?");

        
       
       
        
        
        uint8[3]memory exs;
        uint8[3]memory choice;
        uint[3] memory expectedRates;
        uint[3] memory minOut;
        address[2]memory tokens;
        
       
        
         (tokens,exs,expectedRates,minOut,choice) = abi.decode(_params,(address[2],uint8[3],uint[3],uint[3],uint8[3]));
    if(exs[0] == 1) {
        
        swapTokensUni(_reserve,tokens[0],minOut[0],choice[0]);

    }
    else{
        swapTokensKyber(_reserve,tokens[0],expectedRates[0]);
    }


    if(exs[1] == 1) {

        swapTokensUni(tokens[0],tokens[1],minOut[1],choice[1]);
       

    }
    else{
         swapTokensKyber(tokens[0],tokens[1],expectedRates[1]);
    }
     if(exs[2] == 1) {

        swapTokensUni(tokens[1],_reserve,minOut[2],choice[2]);
       

    }
    else{
        
        swapTokensKyber(tokens[1],_reserve,expectedRates[2]);
    }
    
        
        
        uint totalDebt = _amount.add(_fee);
       
      require(
            IERC20(_reserve).balanceOf(address(this)) >= totalDebt,
            "Not enough funds to repay flashloan!"
        );
        
        
        transferFundsBackToPoolInternal(_reserve, totalDebt);
        
    }

    
    function flashloan(address _reserve,address[2] memory _tokens,uint8[3] memory _exs,uint[3] memory _expectedRate,uint[3] memory _minOut,uint _amount,uint8[3] memory choice) public onlyOwner {
        bytes memory data = abi.encode(_tokens,_exs,_expectedRate,_minOut,choice);

        uint amount;
        if(_reserve==0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 || _reserve==0xdAC17F958D2ee523a2206206994597C13D831ec7){
               amount =  _amount * 1e6;
        }else if(_reserve==0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599){
                amount  = _amount * 1e8;
        }else{
            amount  = _amount * 1e18;
        }
        
        ILendingPool lendingPool = ILendingPool(addressesProvider.getLendingPool());
        lendingPool.flashLoan(address(this), _reserve, amount, data);
        withdraw(_reserve);
        
    }
    
    function swapTokensKyber(address _from, address _to, uint _expectedRate)  public payable{
          
         
         if (_from == ETH_TOKEN_ADDRESS){
            kyber.swapEtherToToken{value:address(this).balance}(IERC20(_to),_expectedRate);
         
         }else if(_to ==ETH_TOKEN_ADDRESS){
              uint tokenBalance  = IERC20(_from).balanceOf(address(this));
              
              require(IERC20(_from).approve(address(kyber), tokenBalance),"Failed to approve to Kyber");
              kyber.swapTokenToEther(IERC20(_from),tokenBalance,_expectedRate);
         }else{
              uint tokenBalance  = IERC20(_from).balanceOf(address(this));
             
             require(IERC20(_from).approve(address(kyber), tokenBalance),"Failed to approve to Kyber");
             
             kyber.swapTokenToToken(IERC20(_from),tokenBalance,IERC20(_to),_expectedRate);
         
         } 
    }   
    
     function swapTokensUni(address _from, address _to, uint _minOuts,uint8 choice) public payable{
         
         
         
        if (_from == ETH_TOKEN_ADDRESS){
           address[] memory path = new address[](2);
             path[0] = uniswap.WETH();
             path[1] = _to;
            
             uniswap.swapExactETHForTokens{value:address(this).balance}(
            _minOuts, 
            path, 
            address(this), 
            now
          );
             
        }else if(_to == ETH_TOKEN_ADDRESS){
            uint tokenBalance = IERC20(_from).balanceOf(address(this));
            address[]memory path = new address[](2);
            path[0]=_from;
            path[1]= uniswap.WETH();
            require(IERC20(_from).approve(address(uniswap),tokenBalance),"Failed to approve token to Uniswap");
             uniswap.swapExactTokensForETH(tokenBalance,_minOuts,path,address(this),now);
            
        }else{
            
            uint tokenBalance = IERC20(_from).balanceOf(address(this));
            address[]memory path;
        
            if(choice == 3){
                path = new address[](3);
                path[0]=_from;
                path[1]=uniswap.WETH();
                path[2]=_to;
            }else{
                 path = new address[](2);
                 path[0]=_from;
                 path[1]=_to;
            }
            
             require(IERC20(_from).approve(address(uniswap),tokenBalance),"Failed to approve token to Uniswap");
            uniswap.swapExactTokensForTokens(tokenBalance,_minOuts,path,address(this),now);
        }
        
        
        
        
        
        
    }
}