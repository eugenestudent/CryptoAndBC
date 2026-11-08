import { network } from "hardhat";

async function main(): Promise<void> {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy(ethers.parseEther("1000000"));
  await myToken.waitForDeployment();

  console.log("MyToken deployed to:", myToken.target);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

