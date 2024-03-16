import { BigNumber, ethers } from "ethers";

export type TransactionInfo = {
  payer: string;
  transactionId: string;
  paymentToken: string;
  paymentAmount: BigNumber;
  receiveToken: string;
  receiveAmount: BigNumber;
  rateExpiredTimestamp: number;
  lockIntervals: number[];
  releasePercents: number[];
  idoLevel: number;
  txProcAddr: string;
};

export function getTransactionHash(txInfo: TransactionInfo): string {
  const hash = ethers.utils.solidityKeccak256(
    [
      "address",
      "bytes16",
      "address",
      "uint256",
      "address",
      "uint256",
      "uint64",
      "uint32[]",
      "uint32[]",
      "uint8",
      "address",
    ],
    [
      txInfo.payer,
      txInfo.transactionId,
      txInfo.paymentToken,
      txInfo.paymentAmount,
      txInfo.receiveToken,
      txInfo.receiveAmount,
      txInfo.rateExpiredTimestamp,
      txInfo.lockIntervals,
      txInfo.releasePercents,
      txInfo.idoLevel,
      txInfo.txProcAddr,
    ]
  );

  return hash;
}

export function getRandomNumber(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
