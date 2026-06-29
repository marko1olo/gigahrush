import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  BANKING_INTEREST_INTERVAL_MINUTES,
  BANKING_LEDGER_CAPACITY,
} from '../src/data/banking';
import {
  accountToCash,
  bankingForSave,
  cashToAccount,
  closeDeposit,
  ensureBankingState,
  normalizeBankingState,
  openDeposit,
  repayLoan,
  takeLoan,
  tickBankingInterest,
  bankingSummary,
} from '../src/systems/banking';
import { createWorldEventState, getRecentEvents } from '../src/systems/events';
import { makeGameState, makeTestPlayer } from './helpers';

test('banking state normalizes old saves to an empty account with no debt', () => {
  const normalized = normalizeBankingState(undefined);

  assert.equal(normalized.accountRubles, 0);
  assert.equal(normalized.depositPrincipal, 0);
  assert.equal(normalized.loanPrincipal, 0);
  assert.equal(normalized.loanAccrued, 0);
  assert.equal(normalized.recentLedger.length, 0);
  assert.ok(normalized.creditLimit > 0);
});

test('cash can move to account and back without overdrawing either side', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({ money: 100 });

  assert.equal(cashToAccount(state, player, 60, 'atm'), true);
  assert.equal(player.money, 40);
  assert.equal(ensureBankingState(state).accountRubles, 60);
  assert.equal(cashToAccount(state, player, 41, 'atm'), false);
  assert.equal(player.money, 40);
  assert.equal(ensureBankingState(state).accountRubles, 60);

  assert.equal(accountToCash(state, player, 25, 'atm'), true);
  assert.equal(player.money, 65);
  assert.equal(ensureBankingState(state).accountRubles, 35);
  assert.equal(accountToCash(state, player, 36, 'atm'), false);

  const events = getRecentEvents(state, { tags: ['banking', 'account'], limit: 2 });
  assert.equal(events.length, 2);
  assert.equal(events[0].tags.includes('withdraw'), true);
  assert.equal(events[1].tags.includes('deposit'), true);
});

test('loans increase account balance and repayment clears interest before principal', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const banking = ensureBankingState(state);
  banking.accountRubles = 50;
  banking.creditLimit = 200;

  assert.equal(takeLoan(state, 150, 'terminal'), true);
  assert.equal(banking.accountRubles, 200);
  assert.equal(banking.loanPrincipal, 150);
  assert.equal(takeLoan(state, 51, 'terminal'), false);

  banking.loanAccrued = 20;
  assert.equal(repayLoan(state, 60, 'terminal'), true);
  assert.equal(banking.accountRubles, 140);
  assert.equal(banking.loanAccrued, 0);
  assert.equal(banking.loanPrincipal, 110);

  assert.equal(repayLoan(state, 1000, 'terminal'), true);
  assert.equal(banking.accountRubles, 30);
  assert.equal(banking.loanPrincipal, 0);
  assert.equal(banking.loanAccrued, 0);
});

test('deposits accrue bounded interest and close back into account', () => {
  const state = makeGameState({
    clock: { hour: 8, minute: 0, totalMinutes: 0 },
    worldEvents: createWorldEventState(),
  });
  const banking = ensureBankingState(state);
  banking.accountRubles = 1000;

  assert.equal(openDeposit(state, 500), true);
  assert.equal(banking.accountRubles, 500);
  assert.equal(banking.depositPrincipal, 500);
  assert.equal(banking.depositOpenedAt, 0);

  state.clock.totalMinutes = BANKING_INTEREST_INTERVAL_MINUTES;
  assert.equal(tickBankingInterest(state), 5);
  assert.equal(banking.depositPrincipal, 505);
  assert.equal(banking.accountRubles, 500);

  assert.equal(closeDeposit(state), 505);
  assert.equal(banking.depositPrincipal, 0);
  assert.equal(banking.accountRubles, 1005);
});

test('bankingForSave returns bounded plain state', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const player = makeTestPlayer({ money: 1000 });

  for (let i = 0; i < BANKING_LEDGER_CAPACITY + 4; i++) {
    assert.equal(cashToAccount(state, player, 1, `cash_${i}`), true);
  }

  const saved = bankingForSave(state);
  assert.equal(saved.recentLedger.length, BANKING_LEDGER_CAPACITY);
  assert.equal(saved.accountRubles, BANKING_LEDGER_CAPACITY + 4);
  assert.equal(saved.recentLedger[0].source, 'cash_4');
  saved.accountRubles = 0;
  assert.equal(ensureBankingState(state).accountRubles, BANKING_LEDGER_CAPACITY + 4);
});

test('bankingSummary provides aggregated data including debt and available credit', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const banking = ensureBankingState(state);

  banking.accountRubles = 150.5;
  banking.depositPrincipal = 500;
  banking.depositRate = 0.05;
  banking.loanPrincipal = 200;
  banking.loanAccrued = 15.25;
  banking.loanRate = 0.1;
  banking.creditLimit = 300;
  banking.lastInterestAt = 120;
  banking.ledgerVersion = 42;

  const summary = bankingSummary(state);

  assert.equal(summary.accountRubles, 150.5);
  assert.equal(summary.depositPrincipal, 500);
  assert.equal(summary.depositRate, 0.05);
  assert.equal(summary.loanPrincipal, 200);
  assert.equal(summary.loanAccrued, 15.25);
  assert.equal(summary.loanRate, 0.1);
  assert.equal(summary.creditLimit, 300);
  assert.equal(summary.lastInterestAt, 120);
  assert.equal(summary.ledgerVersion, 42);

  // Computed values
  assert.equal(summary.debtRubles, 215.25); // 200 + 15.25
  assert.equal(summary.availableCredit, 84.75); // 300 - 215.25

  // Edge case: debt exceeds credit limit
  banking.loanAccrued = 150;
  const summaryOverLimit = bankingSummary(state);
  assert.equal(summaryOverLimit.debtRubles, 350); // 200 + 150
  assert.equal(summaryOverLimit.availableCredit, 0); // Math.max(0, 300 - 350)
});
