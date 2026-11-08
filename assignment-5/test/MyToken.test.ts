import { expect } from "chai";
import { network } from "hardhat";

describe("MyToken", function () {
  async function deployFixture() {
    const { ethers } = await network.connect();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy(ethers.parseEther("1000000"));
    await myToken.waitForDeployment();
    return { ethers, myToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy with the correct name and symbol", async function () {
      const { myToken } = await deployFixture();
      expect(await myToken.name()).to.equal("MyToken");
      expect(await myToken.symbol()).to.equal("MTK");
    });

    it("Should deploy with correct initial supply assigned to deployer", async function () {
      const { ethers, myToken, owner } = await deployFixture();
      expect(await myToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000000")
      );
    });

    it("Should have 18 decimals", async function () {
      const { myToken } = await deployFixture();
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Total supply should equal initial mint", async function () {
      const { ethers, myToken } = await deployFixture();
      expect(await myToken.totalSupply()).to.equal(
        ethers.parseEther("1000000")
      );
    });
  });

  describe("Minting", function () {
    it("Owner can mint additional tokens", async function () {
      const { ethers, myToken, owner, addr1 } = await deployFixture();
      await myToken.connect(owner).mint(addr1.address, ethers.parseEther("500"));
      expect(await myToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("500")
      );
    });

    it("Minting increases total supply", async function () {
      const { ethers, myToken, owner, addr1 } = await deployFixture();
      const before = await myToken.totalSupply();
      await myToken.connect(owner).mint(addr1.address, ethers.parseEther("1000"));
      expect(await myToken.totalSupply()).to.equal(
        before + ethers.parseEther("1000")
      );
    });

    it("Non-owner cannot mint tokens (should revert)", async function () {
      const { ethers, myToken, addr1 } = await deployFixture();
      await expect(
        myToken.connect(addr1).mint(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(myToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { ethers, myToken, owner, addr1 } = await deployFixture();
      await myToken.connect(owner).transfer(addr1.address, ethers.parseEther("100"));
      expect(await myToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("Sender balance decreases after transfer", async function () {
      const { ethers, myToken, owner, addr1 } = await deployFixture();
      const initialBalance = await myToken.balanceOf(owner.address);
      await myToken.connect(owner).transfer(addr1.address, ethers.parseEther("100"));
      expect(await myToken.balanceOf(owner.address)).to.equal(
        initialBalance - ethers.parseEther("100")
      );
    });

    it("Should revert when transferring more tokens than balance", async function () {
      const { ethers, myToken, addr1, addr2 } = await deployFixture();
      await expect(
        myToken.connect(addr1).transfer(addr2.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(myToken, "ERC20InsufficientBalance");
    });

    it("Should handle transferFrom with allowance", async function () {
      const { ethers, myToken, owner, addr1, addr2 } = await deployFixture();
      await myToken.connect(owner).approve(addr1.address, ethers.parseEther("200"));
      await myToken.connect(addr1).transferFrom(
        owner.address,
        addr2.address,
        ethers.parseEther("200")
      );
      expect(await myToken.balanceOf(addr2.address)).to.equal(
        ethers.parseEther("200")
      );
    });

    it("Should revert transferFrom when allowance is exceeded", async function () {
      const { ethers, myToken, owner, addr1, addr2 } = await deployFixture();
      await myToken.connect(owner).approve(addr1.address, ethers.parseEther("50"));
      await expect(
        myToken.connect(addr1).transferFrom(
          owner.address,
          addr2.address,
          ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(myToken, "ERC20InsufficientAllowance");
    });
  });

  describe("Balance Checks", function () {
    it("Non-holder should have zero balance", async function () {
      const { myToken, addr1 } = await deployFixture();
      expect(await myToken.balanceOf(addr1.address)).to.equal(0n);
    });

    it("Balance updates correctly after multiple transfers", async function () {
      const { ethers, myToken, owner, addr1, addr2 } = await deployFixture();
      await myToken.connect(owner).transfer(addr1.address, ethers.parseEther("300"));
      await myToken.connect(addr1).transfer(addr2.address, ethers.parseEther("100"));
      expect(await myToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("200")
      );
      expect(await myToken.balanceOf(addr2.address)).to.equal(
        ethers.parseEther("100")
      );
    });
  });
});