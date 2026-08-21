import type { Transaction, RiskLevel, ThreatType, RecommendedAction } from '@/types';
import { analyzeRisk } from '@/lib/riskEngine';

const LOCATIONS = [
  'Mumbai, IN', 'Bengaluru, IN', 'Delhi, IN', 'Chennai, IN', 'Hyderabad, IN',
  'Pune, IN', 'Kolkata, IN', 'Singapore, SG', 'Dubai, AE', 'London, UK',
  'New York, US', 'Toronto, CA', 'Frankfurt, DE', 'Sydney, AU', 'Tokyo, JP',
  'Lagos, NG', 'São Paulo, BR', 'Unknown, ??',
];

const MERCHANTS = [
  'Amazon Pay', 'Flipkart', 'Swiggy', 'Zomato', 'BigBasket',
  'Myntra', 'BookMyShow', 'IRCTC', 'Uber', 'PhonePe',
  'Paytm Mall', 'Nykaa', 'CRED', 'Groww', 'Zerodha',
];

const DEVICES = [
  { type: 'mobile' as const, os: 'iOS 17.4', browser: 'Safari', fp: 'ios-a8f3...' },
  { type: 'mobile' as const, os: 'Android 14', browser: 'Chrome', fp: 'and-b2c7...' },
  { type: 'desktop' as const, os: 'macOS 14', browser: 'Chrome', fp: 'mac-d9e1...' },
  { type: 'desktop' as const, os: 'Windows 11', browser: 'Edge', fp: 'win-c4f2...' },
  { type: 'tablet' as const, os: 'iPadOS 17', browser: 'Safari', fp: 'ipd-e5a8...' },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(6, '0')}`;
}

function generateIP(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function timestampDaysAgo(days: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  d.setMinutes(d.getMinutes() + hourOffset);
  return d.toISOString();
}

export interface SeedTransactionInput {
  amount: number;
  account_age_days: number;
  is_new_device: boolean;
  is_new_location: boolean;
  failed_attempts: number;
  transaction_velocity: number;
  historical_average: number;
  location: string;
  device_info: string;
  merchant: string;
  ip_address: string;
  timestamp: string;
  user_id: string;
  currency?: string;
}

export function createTransactionFromInput(
  n: number,
  input: SeedTransactionInput
): Transaction {
  const result = analyzeRisk({
    amount: input.amount,
    currency: input.currency || '₹',
    account_age_days: input.account_age_days,
    is_new_device: input.is_new_device,
    is_new_location: input.is_new_location,
    failed_attempts: input.failed_attempts,
    transaction_velocity: input.transaction_velocity,
    historical_average: input.historical_average,
    transaction_id: generateId('TXN', n),
    timestamp: input.timestamp,
    location: input.location,
    device_info: input.device_info,
  });

  return {
    id: generateId('TXN', n),
    amount: input.amount,
    currency: input.currency || '₹',
    user_id: input.user_id,
    device_id: generateId('DEV', n),
    location: input.location,
    timestamp: input.timestamp,
    account_age_days: input.account_age_days,
    is_new_device: input.is_new_device,
    is_new_location: input.is_new_location,
    failed_attempts: input.failed_attempts,
    transaction_velocity: input.transaction_velocity,
    historical_average: input.historical_average,
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    threat_type: result.threat_type,
    recommended_action: result.recommended_action,
    device_info: input.device_info,
    ip_address: input.ip_address,
    merchant: input.merchant,
  };
}

export function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  let n = 1;

  // Scenario 1: Normal transactions (50)
  for (let i = 0; i < 50; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(500, 3000);
    const amount = randomInt(Math.round(avg * 0.5), Math.round(avg * 1.5));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(90, 800),
        is_new_device: false,
        is_new_location: false,
        failed_attempts: 0,
        transaction_velocity: randomInt(0, 2),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(0, 5)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 7)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  // Scenario 2: Account takeover (15)
  for (let i = 0; i < 15; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(1000, 5000);
    const amount = randomInt(Math.round(avg * 3), Math.round(avg * 8));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(30, 500),
        is_new_device: true,
        is_new_location: true,
        failed_attempts: randomInt(3, 7),
        transaction_velocity: randomInt(4, 8),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(8, 14)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 3)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  // Scenario 3: Velocity attack (12)
  for (let i = 0; i < 12; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(800, 3000);
    const amount = randomInt(Math.round(avg * 2), Math.round(avg * 5));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(60, 400),
        is_new_device: Math.random() > 0.5,
        is_new_location: false,
        failed_attempts: randomInt(0, 2),
        transaction_velocity: randomInt(6, 12),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(0, 7)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 2)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  // Scenario 4: Suspicious device (8)
  for (let i = 0; i < 8; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(1000, 4000);
    const amount = randomInt(Math.round(avg * 0.8), Math.round(avg * 2));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(45, 300),
        is_new_device: true,
        is_new_location: false,
        failed_attempts: randomInt(0, 2),
        transaction_velocity: randomInt(1, 3),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(0, 5)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 4)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  // Scenario 5: Unusual amount (8)
  for (let i = 0; i < 8; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(500, 2000);
    const amount = randomInt(Math.round(avg * 5), Math.round(avg * 15));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(100, 600),
        is_new_device: false,
        is_new_location: false,
        failed_attempts: 0,
        transaction_velocity: randomInt(0, 2),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(0, 5)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 5)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  // Scenario 6: Multiple failed attempts (7)
  for (let i = 0; i < 7; i++) {
    const device = randomFrom(DEVICES);
    const avg = randomInt(1000, 4000);
    const amount = randomInt(Math.round(avg * 1), Math.round(avg * 3));
    transactions.push(
      createTransactionFromInput(n++, {
        amount,
        account_age_days: randomInt(20, 200),
        is_new_device: false,
        is_new_location: false,
        failed_attempts: randomInt(3, 6),
        transaction_velocity: randomInt(1, 4),
        historical_average: avg,
        location: randomFrom(LOCATIONS.slice(0, 5)),
        device_info: `${device.type} / ${device.os} / ${device.browser}`,
        merchant: randomFrom(MERCHANTS),
        ip_address: generateIP(),
        timestamp: timestampDaysAgo(randomInt(0, 3)),
        user_id: generateId('USR', randomInt(1, 200)),
      })
    );
  }

  return transactions;
}

export function generateDashboardStats(transactions: Transaction[]) {
  const high_risk = transactions.filter(
    (t) => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL'
  ).length;
  const under_review = transactions.filter(
    (t) => t.recommended_action === 'REVIEW' || t.recommended_action === 'HOLD'
  ).length;
  const fraud_prevented = transactions.filter(
    (t) => t.risk_level === 'CRITICAL'
  ).length;

  const low = transactions.filter((t) => t.risk_level === 'LOW').length;
  const medium = transactions.filter((t) => t.risk_level === 'MEDIUM').length;
  const high = transactions.filter((t) => t.risk_level === 'HIGH').length;
  const critical = transactions.filter((t) => t.risk_level === 'CRITICAL').length;

  const avgScore = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.risk_score, 0) / transactions.length
    : 0;

  const trend = generateTrendData(transactions);

  return {
    transactions_analyzed: transactions.length,
    high_risk,
    under_review,
    fraud_prevented,
    ai_confidence: Math.round((94 + randomFloat(0, 4)) * 10) / 10,
    risk_distribution: { low, medium, high, critical },
    trend,
  };
}

function generateTrendData(transactions: Transaction[]) {
  const hours: { hour: string; transactions: number; risk_score: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    const hourLabel = d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
    const hourTxns = transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      return tDate.getHours() === d.getHours() && tDate.getDate() === d.getDate();
    });
    const avgRisk = hourTxns.length > 0
      ? Math.round(hourTxns.reduce((s, t) => s + t.risk_score, 0) / hourTxns.length)
      : randomInt(10, 40);
    hours.push({
      hour: hourLabel,
      transactions: hourTxns.length || randomInt(2, 15),
      risk_score: avgRisk,
    });
  }
  return hours;
}
