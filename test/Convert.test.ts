import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BigNumber, Contract, ContractTransaction } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

function daysToSeconds(days: number): number {
  return 86400 * days;
}

async function nextTime(timestamp: number) {
  await time.increaseTo((await time.latest()) + timestamp);
}

function normalizeBalance(balance: number | string): BigNumber {
  const decimalPostfix = ethers.BigNumber.from(10).pow(
    ethers.BigNumber.from(18)
  );
  return ethers.BigNumber.from(balance).mul(decimalPostfix);
}

describe("Convert", () => {
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let deployer: SignerWithAddress;

  let convert: Contract;
  let lscToken: Contract;
  let bhoToken: Contract;

  const TOTAL_SUPPLY = 10000000000;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const RATE = 2000; // 1 LSC = 2 BHO
  const VESTING_IDS = [0, 1, 2, 3, 4];
  const AMOUNT_CONVERTIBLE = [
    normalizeBalance(1005),
    normalizeBalance(2000),
    normalizeBalance(3000),
    normalizeBalance(4000),
    normalizeBalance(5000),
  ];
  const AMOUNT_CONVERT_PER_DAY = [
    normalizeBalance(100),
    normalizeBalance(200),
    normalizeBalance(300),
    normalizeBalance(400),
    normalizeBalance(500),
  ];
  const CURRENT_CONVERT_ID = 5;

  async function deployConvert() {
    const Convert = await ethers.getContractFactory("Convert");
    convert = await upgrades.deployProxy(Convert, [
      admin.address,
      lscToken.address,
      bhoToken.address,
      RATE,
    ]);
    await convert.deployed();
  }

  async function deployToken() {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    lscToken = await MockERC20.deploy("Mock LSC", "M-LSC", TOTAL_SUPPLY);
    await lscToken.deployed();

    bhoToken = await MockERC20.deploy("Mock BHO", "M-BHO", TOTAL_SUPPLY);
    await bhoToken.deployed();
  }

  before(async () => {
    [deployer, admin, user1, user2] = await ethers.getSigners();
    await deployToken();
    await deployConvert();

    lscToken.connect(user1).mintTokens(normalizeBalance(2000));
    lscToken.connect(user1).approve(convert.address, normalizeBalance(2000000));
    lscToken.connect(user2).approve(convert.address, normalizeBalance(2000000));

    bhoToken.connect(admin).mintTokens(normalizeBalance(5000));
  });

  it("Should initialize", async () => {
    expect(await convert.admin()).to.equal(admin.address);
    expect(await convert.lscToken()).to.equal(lscToken.address);
    expect(await convert.bhoToken()).to.equal(bhoToken.address);
  });

  it("Should set up wallet pool work as expected ", async () => {
    await convert
      .connect(admin)
      .setWalletPool(
        [user1.address, user2.address],
        [normalizeBalance(1000), normalizeBalance(2000)]
      );
    const user1WalletPool = await convert.walletPoolLedger(user1.address);
    const user2WalletPool = await convert.walletPoolLedger(user2.address);
    expect(user1WalletPool.amountConvertible).to.equal(normalizeBalance(1000));
    expect(user2WalletPool.amountConvertible).to.equal(normalizeBalance(2000));
  });

  it("Should convert wallet pool work as expected", async () => {
    await convert
      .connect(admin)
      .setWalletPool(
        [user1.address, user2.address],
        [normalizeBalance(1000), normalizeBalance(2000)]
      );

    await expect(
      convert.connect(user1).convertWalletPool(normalizeBalance(0))
    ).to.be.revertedWith("Amount must be greater than 0");
    await expect(
      convert.connect(user1).convertWalletPool(normalizeBalance(3000))
    ).to.be.revertedWith("Exceed convertible amount");
    await expect(
      convert.connect(user2).convertWalletPool(normalizeBalance(1000))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    await expect(
      convert.connect(user1).convertWalletPool(normalizeBalance(200))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    bhoToken.connect(admin).transfer(convert.address, normalizeBalance(2000));
    const balanceBHOBefor = await bhoToken.balanceOf(user1.address);
    const balanceLSCBefor = await lscToken.balanceOf(user1.address);
    const timeClaim = await time.latest();
    await expect(
      convert.connect(user1).convertWalletPool(normalizeBalance(200))
    )
      .to.emit(convert, "ConvertWalletPool")
      .withArgs(
        user1.address,
        timeClaim + 1,
        normalizeBalance(200),
        normalizeBalance(400)
      );
    const balanceBHOAfter = await bhoToken.balanceOf(user1.address);
    const balanceLSCAfter = await lscToken.balanceOf(user1.address);
    expect(balanceBHOAfter.sub(balanceBHOBefor)).to.equal(
      normalizeBalance(400)
    );
    expect(balanceLSCBefor.sub(balanceLSCAfter)).to.equal(
      normalizeBalance(200)
    );
  });

  it("Should set up b2e pool work as expected ", async () => {
    const START_TIMESTAMPS = [
      (await time.latest()) + daysToSeconds(1),
      (await time.latest()) + daysToSeconds(2),
      (await time.latest()) + daysToSeconds(3),
      (await time.latest()) + daysToSeconds(4),
      (await time.latest()) + daysToSeconds(5),
    ];
    const CLOSE_TIMESTAMPS = [
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
    ];
    const LATEST_CONVERT_TIMESTAMPS = [
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
    ];

    await convert
      .connect(admin)
      .setB2EPool(
        user1.address,
        CURRENT_CONVERT_ID,
        VESTING_IDS,
        AMOUNT_CONVERTIBLE,
        AMOUNT_CONVERT_PER_DAY,
        START_TIMESTAMPS,
        CLOSE_TIMESTAMPS,
        LATEST_CONVERT_TIMESTAMPS
      );
    const b2ePool = await convert.b2ePoolLedger(user1.address);
    expect(b2ePool).to.equal(CURRENT_CONVERT_ID);

    const convertInfo = await convert.getConvertB2EPoolInfo(user1.address, 0);
    expect(convertInfo.amountConvertible).to.equal(AMOUNT_CONVERTIBLE[0]);
    expect(convertInfo.amountConvertPerDay).to.equal(AMOUNT_CONVERT_PER_DAY[0]);
    expect(convertInfo.startTimestamp).to.equal(START_TIMESTAMPS[0]);
    expect(convertInfo.closeTimestamp).to.equal(CLOSE_TIMESTAMPS[0]);
  });
  it("Should convert b2e pool work as expected", async () => {
    const START_TIMESTAMPS = [
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
    ];
    const CLOSE_TIMESTAMPS = [
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
      (await time.latest()) + daysToSeconds(10),
    ];
    const LATEST_CONVERT_TIMESTAMPS = [
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
      await time.latest(),
    ];

    await convert
      .connect(admin)
      .setB2EPool(
        user1.address,
        CURRENT_CONVERT_ID,
        VESTING_IDS,
        AMOUNT_CONVERTIBLE,
        AMOUNT_CONVERT_PER_DAY,
        START_TIMESTAMPS,
        CLOSE_TIMESTAMPS,
        LATEST_CONVERT_TIMESTAMPS
      );

    await convert
      .connect(admin)
      .setB2EPool(
        user2.address,
        CURRENT_CONVERT_ID,
        VESTING_IDS,
        AMOUNT_CONVERTIBLE,
        AMOUNT_CONVERT_PER_DAY,
        START_TIMESTAMPS,
        CLOSE_TIMESTAMPS,
        LATEST_CONVERT_TIMESTAMPS
      );
    expect(
      await convert.connect(user1).b2ePoolConvertible(user1.address, 0)
    ).to.eq(true);
    await bhoToken.connect(admin).mintTokens(normalizeBalance(1000000));
    await bhoToken
      .connect(admin)
      .transfer(convert.address, normalizeBalance(1000000));

    await nextTime(daysToSeconds(1));
    let timeClaim = await time.latest();
    await expect(convert.connect(user1).convertB2EPool(0))
      .to.emit(convert, "ConvertB2EPool")
      .withArgs(
        user1.address,
        0,
        timeClaim + 1,
        normalizeBalance(100),
        normalizeBalance(200)
      );

    await nextTime(daysToSeconds(10));
    timeClaim = await time.latest();
    await expect(convert.connect(user1).convertB2EPool(0))
      .to.emit(convert, "ConvertB2EPool")
      .withArgs(
        user1.address,
        0,
        timeClaim + 1,
        normalizeBalance(905),
        normalizeBalance(1810)
      );

    await expect(convert.connect(user1).convertB2EPool(0)).to.be.revertedWith(
      "Not eligible for convert"
    );

    await expect(convert.connect(user2).convertB2EPool(0)).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance"
    );
  });
});
