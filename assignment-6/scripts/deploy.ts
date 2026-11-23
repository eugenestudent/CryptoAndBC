import { network } from "hardhat";

async function main(): Promise<void> {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  console.log("\n--- Step 1: Deploying MyTokenV1 (implementation) ---");
  const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
  const v1Impl = await MyTokenV1.deploy();
  await v1Impl.waitForDeployment();
  console.log("MyTokenV1 implementation deployed to:", v1Impl.target);

  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 MTK
  const initData = MyTokenV1.interface.encodeFunctionData("initialize", [initialSupply]);
  console.log("\nEncoded initialize() call data:", initData.slice(0, 20) + "...");

  console.log("\n--- Step 2: Deploying MyTokenProxy ---");
  const MyTokenProxy = await ethers.getContractFactory("MyTokenProxy");
  const proxy = await MyTokenProxy.deploy(v1Impl.target, initData);
  await proxy.waitForDeployment();
  console.log("MyTokenProxy deployed to:", proxy.target);

  console.log("\n--- Step 3: Verifying proxy works ---");
  // Attach the V1 ABI to the proxy address so we can call ERC20 functions
  const token = MyTokenV1.attach(proxy.target);

  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const balance = await token.balanceOf(deployer.address);

  console.log("Token name:    ", name);
  console.log("Token symbol:  ", symbol);
  console.log("Total supply:  ", ethers.formatEther(totalSupply), "MTK");
  console.log("Deployer bal.: ", ethers.formatEther(balance), "MTK");

  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("Implementation (V1):", v1Impl.target);
  console.log("Proxy:              ", proxy.target);
  console.log("Owner:              ", deployer.address);
  console.log("==========================================");
  console.log("\nSave the PROXY address — users always interact with:", proxy.target);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

