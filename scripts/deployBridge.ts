import { ethers, network, run, upgrades } from "hardhat";
import config from "../config";
import { sleep } from "../utils";

async function main() {
  if (network.name === "bscTestnet" || network.name === "bscMainnet") {
    const Bridge = await ethers.getContractFactory("Bridge");

    const bridge = await upgrades.deployProxy(Bridge, [
      config.admin[network.name],
      config.minaToken[network.name],
      config.serciveFee[network.name],
      config.platFormFee[network.name],
      config.mintDeposit[network.name],
    ]);

    await bridge.deployed();

    console.log(`Contract deployed at ${bridge.address}`);

    await sleep(10000);

    const implAddr = await upgrades.erc1967.getImplementationAddress(
      bridge.address
    );

    await run("verify:verify", {
      address: implAddr,
      constructorArguments: [],
    });

    await bridge.forceRegisterChain(config.chains[0]);
    await bridge.forceRegisterChain(config.chains[1]);
  } else {
    console.log("Network not supported");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
