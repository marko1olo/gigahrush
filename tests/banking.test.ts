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
  assert.equal(banking.depositOpenedAt, 0);
  assert.equal(banking.accountRubles, 1005);
});

test('closeDeposit returns 0 and does nothing if deposit is empty', () => {
  const state = makeGameState({ worldEvents: createWorldEventState() });
  const banking = ensureBankingState(state);
  banking.accountRubles = 1000;
  banking.depositPrincipal = 0;

  assert.equal(closeDeposit(state), 0);
  assert.equal(banking.accountRubles, 1000);
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
