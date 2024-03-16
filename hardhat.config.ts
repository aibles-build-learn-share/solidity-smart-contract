import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-docgen";
import "hardhat-contract-sizer";
import "hardhat-spdx-license-identifier";
import "hardhat-tracer";
import "hardhat-abi-exporter";
import "@openzeppelin/hardhat-upgrades";

dotenv.config();

function getWallet(): Array<string> {
  return process.env.DEPLOYER_WALLET_PRIVATE_KEY !== undefined
    ? [process.env.DEPLOYER_WALLET_PRIVATE_KEY]
    : [];
}

const config: HardhatUserConfig = {
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
  contractSizer: {
    runOnCompile: false,
    strict: true,
  },
  spdxLicenseIdentifier: {
    runOnCompile: false,
  },
  gasReporter: {
    enabled:
      process.env.REPORT_GAS !== undefined
        ? process.env.REPORT_GAS.toLowerCase() === "true"
        : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    gasPriceApi: process.env.GAS_PRICE_API || "",
    token: "ETH",
    currency: "USD",
  },
  abiExporter: {
    runOnCompile: false,
    path: "./abi",
    clear: true,
    pretty: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize:
        (process.env.ALLOW_UNLIMITED_CONTRACT_SIZE &&
          "true" === process.env.ALLOW_UNLIMITED_CONTRACT_SIZE.toLowerCase()) ||
        false,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [process.env.DEPLOYER_WALLET_PRIVATE_KEY || ""],
    },
    bscMainnet: {
      url: "https://bsc-dataseed1.binance.org/",
      accounts: [process.env.DEPLOYER_WALLET_PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
    },
  },
};

export default config;
