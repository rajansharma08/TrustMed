import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Example: set RPC_URL + PRIVATE_KEY in .env to deploy to a testnet.
    // testnet: {
    //   url: RPC_URL,
    //   accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    // },
  },
};

export default config;
