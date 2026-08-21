import type { Transaction, SimulationResult } from '@/types';
import { analyzeRisk } from '@/lib/riskEngine';
import { createTransactionFromInput } from '@/lib/seedData';
import type { SeedTransactionInput } from '@/lib/seedData';

function generateIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timestampNow(): string {
  return new Date().toISOString();
}

let simCounter = 100001;

export function simulateAccountTakeover(): SimulationResult {
  const avg = randomInt(1500, 4000);
  const amount = randomInt(avg * 4, avg * 10);
  const input: SeedTransactionInput = {
    amount,
    account_age_days: randomInt(120, 400),
    is_new_device: true,
    is_new_location: true,
    failed_attempts: randomInt(4, 7),
    transaction_velocity: randomInt(5, 9),
    historical_average: avg,
    location: 'Unknown, ??',
    device_info: 'mobile / Android 14 / Chrome',
    merchant: 'Amazon Pay',
    ip_address: generateIP(),
    timestamp: timestampNow(),
    user_id: `USR-${randomInt(1, 200)}`,
  };
  const txn = createTransactionFromInput(simCounter++, input);
  const result = analyzeRisk({
    amount: txn.amount,
    currency: txn.currency,
    account_age_days: txn.account_age_days,
    is_new_device: txn.is_new_device,
    is_new_location: txn.is_new_location,
    failed_attempts: txn.failed_attempts,
    transaction_velocity: txn.transaction_velocity,
    historical_average: txn.historical_average,
    transaction_id: txn.id,
    timestamp: txn.timestamp,
    location: txn.location,
    device_info: txn.device_info,
  });
  return {
    transaction: txn,
    analysis: {
      transaction_id: txn.id,
      ...result,
    },
  };
}

export function simulateVelocityAttack(): SimulationResult {
  const avg = randomInt(800, 2500);
  const amount = randomInt(avg * 2, avg * 5);
  const input: SeedTransactionInput = {
    amount,
    account_age_days: randomInt(60, 300),
    is_new_device: Math.random() > 0.5,
    is_new_location: false,
    failed_attempts: randomInt(0, 2),
    transaction_velocity: randomInt(7, 14),
    historical_average: avg,
    location: 'Mumbai, IN',
    device_info: 'desktop / macOS 14 / Chrome',
    merchant: 'Flipkart',
    ip_address: generateIP(),
    timestamp: timestampNow(),
    user_id: `USR-${randomInt(1, 200)}`,
  };
  const txn = createTransactionFromInput(simCounter++, input);
  const result = analyzeRisk({
    amount: txn.amount,
    currency: txn.currency,
    account_age_days: txn.account_age_days,
    is_new_device: txn.is_new_device,
    is_new_location: txn.is_new_location,
    failed_attempts: txn.failed_attempts,
    transaction_velocity: txn.transaction_velocity,
    historical_average: txn.historical_average,
    transaction_id: txn.id,
    timestamp: txn.timestamp,
    location: txn.location,
    device_info: txn.device_info,
  });
  return {
    transaction: txn,
    analysis: {
      transaction_id: txn.id,
      ...result,
    },
  };
}

export function simulateSuspiciousDevice(): SimulationResult {
  const avg = randomInt(1000, 3000);
  const amount = randomInt(avg * 1, avg * 2.5);
  const input: SeedTransactionInput = {
    amount,
    account_age_days: randomInt(45, 250),
    is_new_device: true,
    is_new_location: false,
    failed_attempts: randomInt(0, 2),
    transaction_velocity: randomInt(1, 3),
    historical_average: avg,
    location: 'Bengaluru, IN',
    device_info: 'tablet / iPadOS 17 / Safari',
    merchant: 'Swiggy',
    ip_address: generateIP(),
    timestamp: timestampNow(),
    user_id: `USR-${randomInt(1, 200)}`,
  };
  const txn = createTransactionFromInput(simCounter++, input);
  const result = analyzeRisk({
    amount: txn.amount,
    currency: txn.currency,
    account_age_days: txn.account_age_days,
    is_new_device: txn.is_new_device,
    is_new_location: txn.is_new_location,
    failed_attempts: txn.failed_attempts,
    transaction_velocity: txn.transaction_velocity,
    historical_average: txn.historical_average,
    transaction_id: txn.id,
    timestamp: txn.timestamp,
    location: txn.location,
    device_info: txn.device_info,
  });
  return {
    transaction: txn,
    analysis: {
      transaction_id: txn.id,
      ...result,
    },
  };
}

export function simulateNormalTransaction(): SimulationResult {
  const avg = randomInt(500, 2500);
  const amount = randomInt(Math.round(avg * 0.5), Math.round(avg * 1.3));
  const input: SeedTransactionInput = {
    amount,
    account_age_days: randomInt(120, 800),
    is_new_device: false,
    is_new_location: false,
    failed_attempts: 0,
    transaction_velocity: randomInt(0, 2),
    historical_average: avg,
    location: 'Mumbai, IN',
    device_info: 'mobile / iOS 17.4 / Safari',
    merchant: 'PhonePe',
    ip_address: generateIP(),
    timestamp: timestampNow(),
    user_id: `USR-${randomInt(1, 200)}`,
  };
  const txn = createTransactionFromInput(simCounter++, input);
  const result = analyzeRisk({
    amount: txn.amount,
    currency: txn.currency,
    account_age_days: txn.account_age_days,
    is_new_device: txn.is_new_device,
    is_new_location: txn.is_new_location,
    failed_attempts: txn.failed_attempts,
    transaction_velocity: txn.transaction_velocity,
    historical_average: txn.historical_average,
    transaction_id: txn.id,
    timestamp: txn.timestamp,
    location: txn.location,
    device_info: txn.device_info,
  });
  return {
    transaction: txn,
    analysis: {
      transaction_id: txn.id,
      ...result,
    },
  };
}

export function runSimulation(type: 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal'): SimulationResult {
  switch (type) {
    case 'account-takeover':
      return simulateAccountTakeover();
    case 'velocity':
      return simulateVelocityAttack();
    case 'suspicious-device':
      return simulateSuspiciousDevice();
    case 'normal':
      return simulateNormalTransaction();
  }
}
