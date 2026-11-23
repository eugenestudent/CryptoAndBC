import { network } from "hardhat";

async function main(): Promise<void> {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);

  const PROXY_ADDRESS = process.env.PROXY_ADDRESS;
  if (!PROXY_ADDRESS) {
    throw new Error("Set PROXY_ADDRESS env variable. Example:\n  PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade.ts");
  }

  console.log("\n--- Balances BEFORE upgrade ---");
  const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
  const tokenV1 = MyTokenV1.attach(PROXY_ADDRESS);

  const balanceBefore = await tokenV1.balanceOf(deployer.address);
  const totalSupplyBefore = await tokenV1.totalSupply();
  console.log("Deployer balance:", ethers.formatEther(balanceBefore), "MTK");
  console.log("Total supply:    ", ethers.formatEther(totalSupplyBefore), "MTK");

  console.log("\n--- Deploying MyTokenV2 (new implementation) ---");
  const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
  const v2Impl = await MyTokenV2.deploy();
  await v2Impl.waitForDeployment();
  console.log("MyTokenV2 implementation deployed to:", v2Impl.target);

  console.log("\n--- Upgrading proxy to V2 ---");
  const upgradeTx = await tokenV1.upgradeToAndCall(v2Impl.target, "0x");
  await upgradeTx.wait();
  console.log("Upgrade transaction hash:", upgradeTx.hash);

  console.log("\n--- Balances AFTER upgrade ---");
  const tokenV2 = MyTokenV2.attach(PROXY_ADDRESS);

  const balanceAfter = await tokenV2.balanceOf(deployer.address);
  const totalSupplyAfter = await tokenV2.totalSupply();
  console.log("Deployer balance:", ethers.formatEther(balanceAfter), "MTK");
  console.log("Total supply:    ", ethers.formatEther(totalSupplyAfter), "MTK");

  const ver = await tokenV2.version();
  console.log("\nversion() returned:", ver);

  console.log("\n========== UPGRADE COMPLETE ==========");
  console.log("Proxy (unchanged):", PROXY_ADDRESS);
  console.log("Old impl (V1):    ", "(no longer used)");
  console.log("New impl (V2):    ", v2Impl.target);
  console.log("Balances preserved:", balanceBefore === balanceAfter ? "YES" : "NO");
  console.log("version() = \"" + ver + "\":", ver === "V2" ? "YES" : "NO");
  console.log("=======================================");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});