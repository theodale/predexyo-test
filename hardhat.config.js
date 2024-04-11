require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/ac8a137d5dad47aea4728f330f01ac4d",
      },
    },
  },
};
