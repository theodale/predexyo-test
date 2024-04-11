const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Initial Vault Tests", function () {
  // We are running tests through Hardhat Network from default mainnet fork
  const WETH = new ethers.Contract(
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
    ],
    ethers.provider
  );

  // Deploy fresh setup before each test
  beforeEach(async function () {
    this.User = await ethers.provider.getSigner();

    const vaultFactory = await ethers.getContractFactory("Vault");
    const testTokenFactory = await ethers.getContractFactory("TestToken");

    this.Vault = await vaultFactory.deploy(WETH.getAddress());
    this.TestToken = await testTokenFactory.deploy();
  });

  const DEPOSIT = ethers.parseEther("1");

  it("depositETH", async function () {
    await expect(() =>
      this.Vault.depositETH({ value: DEPOSIT })
    ).to.changeEtherBalances([this.User, this.Vault], [-DEPOSIT, DEPOSIT]);
  });

  it("withdrawETH", async function () {
    await this.Vault.depositETH({ value: DEPOSIT });

    await expect(() => this.Vault.withdrawETH(DEPOSIT)).to.changeEtherBalances(
      [this.User, this.Vault],
      [DEPOSIT, -DEPOSIT]
    );
  });

  it("swapETHToWETH", async function () {
    await this.Vault.depositETH({ value: DEPOSIT });

    const swap = this.Vault.swapETHToWETH(DEPOSIT);

    await expect(swap).to.changeEtherBalance(this.Vault, -DEPOSIT);
    await expect(swap).to.changeTokenBalance(WETH, this.Vault, DEPOSIT);
  });

  it("swapWETHToETH", async function () {
    await this.Vault.depositETH({ value: DEPOSIT });

    await this.Vault.swapETHToWETH(DEPOSIT);

    const swap = await this.Vault.swapWETHToETH(DEPOSIT);

    await expect(swap).to.changeEtherBalance(this.Vault, DEPOSIT);
    await expect(swap).to.changeTokenBalance(WETH, this.Vault, -DEPOSIT);
  });

  it("depositERC20", async function () {
    await this.TestToken.mint(this.User.getAddress(), DEPOSIT);
    await this.TestToken.approve(this.Vault.getAddress(), DEPOSIT);

    await expect(() =>
      this.Vault.depositERC20(this.TestToken.getAddress(), DEPOSIT)
    ).to.changeTokenBalances(
      this.TestToken,
      [this.User, this.Vault],
      [-DEPOSIT, DEPOSIT]
    );
  });

  it("withdrawERC20", async function () {
    await this.TestToken.mint(this.User.getAddress(), DEPOSIT);
    await this.TestToken.approve(this.Vault.getAddress(), DEPOSIT);

    await this.Vault.depositERC20(this.TestToken.getAddress(), DEPOSIT);

    await expect(() =>
      this.Vault.withdrawERC20(this.TestToken.getAddress(), DEPOSIT)
    ).to.changeTokenBalances(
      this.TestToken,
      [this.User, this.Vault],
      [DEPOSIT, -DEPOSIT]
    );
  });
});
