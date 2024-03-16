import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network, run } from "hardhat";

const main = async () => {
  // Get network data from Hardhat config (see hardhat.config.ts).
  const networkName = network.name;

  // Check if the network is supported.
  if (networkName === "bscTestnet" || networkName === "testnet") {
    console.log(`Deploying to ${networkName} network...`);
    const deployer = (await ethers.getSigners())[0];

    // Compile contracts.
    await run("compile");
    console.log("Compiled contracts...");

    // Deploy contracts.
    const MockMINA = await ethers.getContractFactory("MockERC20");

    const decimal = 18;
    const decimalPostfix = ethers.BigNumber.from(10).pow(
      ethers.BigNumber.from(decimal)
    );
    const totalSupply =
      ethers.BigNumber.from(10_000_000_000).mul(decimalPostfix);
    const constructorArgs: [string, string, BigNumber] = [
      "Mock Mina",
      "M-MINA",
      totalSupply,
    ];
    const contract = await MockMINA.connect(deployer).deploy(
      ...constructorArgs
    );

    // Wait for the contract to be deployed before exiting the script.
    await contract.deployed();
    console.log(`Deployed to ${contract.address}`);

    console.log(`Wait to verify contract`);
    await new Promise((resolve) => {
      setTimeout(resolve, 60 * 1000);
    });

    await run("verify:verify", {
      address: contract.address,
      constructorArguments: constructorArgs,
    });
  } else {
    console.log(`Deploying to ${networkName} network is not supported...`);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
