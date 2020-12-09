# Aave Flash Loan Truffle Box with Triangular Arbitrage Bot

This is a triangular arbitrage bot which uses node.js and gets data from IKyberProxy contract and UniswapV2Router2 contract.

## Installation and Setup

0. Install Truffle globally, if not already installed.
    ```
    clone the repository
    ```
    

2. Edit the following values in the file:
    - Sign up for [Infura](https://infura.io/) (or a similar provider) and replace `INFURA_KEY` with an API key for your project (this is called Project ID in the Infra dashboard).
    - Replace `DEPLOYMENT_ACCOUNT_KEY` with the private key of the ethereum account you will be using to deploy the contracts. This account will become the `owner` of the contract.
    - You can add INFURA_PROJECT_ID in case API does not work
3. Ensure your ethereum account has some ETH to deploy the contract.
4. In your terminal, navigate to your repo directory and install the dependencies (if not already done):
    ```
    npm install
    ```
5. In the same terminal, replace `NAME_OF_YOUR_NETWORK` with either `kovan`, `ropsten`, or `mainnet` (depending on where you want to deploy the contract):
    ```
    truffle console --network NAME_OF_YOUR_NETWORK
    ```
6. You are now connected to the network you chose. In the same terminal window:
    ```
    migrate --reset
    ```
7. After a few minutes, your contract will be deployed on your chosen network.
    - If you have not added any profitable logic to `Flashloan.sol` line 23, then you will need to fund your contract with the desired asset.
    - See our [documentation](https://docs.aave.com/developers/developing-on-aave/deployed-contract-instances#reserves-assets) for token address and faucets.
8.  Call node index.js and the bot is running. 
