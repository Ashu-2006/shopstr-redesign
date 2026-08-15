# Settings + Wallet: making the dead surfaces real

Status: proposed, awaiting decisions on the open questions at the end.
Grounded in a read of upstream `shopstr-eng/shopstr` (cloned and inspected, not
guessed) plus an audit of what our prototype currently wires.

---

## 1. What is actually broken right now

Audited, not estimated:

| Surface | State today |
|---|---|
| `/settings` | 8 rows. **5 are dead `<div>`s** with no `href` and no handler: Saved addresses, Relays, Nostr Wallet Connect, Preferences, Keys & backup. They render a `→` affordance that does nothing. |
| `/wallet/send` | 2 inputs, **both uncontrolled**. No validation. The CTA ignores them and routes to `/withdraw`. |
| `/wallet/receive` | 1 uncontrolled input. |
| `/wallet/payout` | Choice persists to session state, but nothing downstream reads it. |
| `walletBalance` | A **fixed constant** (182,400) in `data/store.tsx` with no setter. No send, receive, claim, or purchase can move it. |
| Wallet setup | **Does not exist.** There is no "connect a wallet" step anywhere, so the wallet is presented as already-working with no origin story. |

The through-line: these screens were built as visual surfaces. They look
finished and behave like nothing.

## 2. What upstream actually does

Read from the cloned repo, so we mirror real behaviour rather than inventing it.

**Settings IA** (`pages/settings/index.tsx`) is one Account section plus Log out:
Shop Profile, User Profile, Community Management, Preferences, Nostr Wallet
Connect, API Keys. Notably there is **no top-level "Saved addresses" and no
top-level "Relays"**: both live *inside* Preferences.

**Preferences** (`pages/settings/preferences.tsx`) is one page hosting four
managers, each an add/remove list persisted to localStorage:
- **Mints** (Cashu), validated via `POST /api/cashu/validate-mint` before being accepted
- **Relays**, split into all / read / write (NIP-65), validated by actually opening `Relay.connect(url)`
- **Blossom media servers**
- **Saved addresses** (edit + delete)

**Nostr Wallet Connect** (`pages/settings/nostr-wallet-connect.tsx`): paste a
`nostr+walletconnect://` string; validate the prefix, a 64-hex `secret` param,
and a `relay` param; `enable()` then `getInfo()`; persist the string and info;
show connection state and a live balance when the wallet advertises
`get_balance`.

**Wallet setup exists upstream as onboarding** (`pages/onboarding/wallet.tsx`),
literally "Step 4: Connect Wallet", with **Connect & Continue** and an explicit
**Skip for now**. This is the missing flow you flagged.

**The wallet** (`pages/wallet/index.tsx` + `components/wallet/*`) is a real
NIP-60 Cashu wallet: proofs filtered by mint keyset, balance summed from
proofs, and Mint / Receive / Send / Pay buttons. Send validates the amount
against balance, swaps proofs, writes the remainder back, and appends a
history entry. History is a list of `{type, amount, date}` with **six types**
(receive, send, mint, melt, purchase, …).

## 3. What I propose we build

We are frontend + mock only, so the goal is **honest, complete-feeling flows
over a mock ledger**, shaped exactly like upstream so the port is mechanical.

### Phase A: Make the ledger real (foundation, unblocks everything)

`data/store.tsx` today exposes a read-only `walletBalance`. Replace with a
small mock ledger in the existing hooks-only boundary:

- `balance: number` derived from a transaction list, never stored twice
  (same rule the reviews system already follows).
- `txns: Txn[]` where `Txn = { id, type, amount, at, memo? }` and `type` is our
  named union mapped 1:1 onto upstream's six numeric types.
- Actions: `receive(amount)`, `send(amount)`, `claim(id)`, `spend(amount)` for
  checkout.
- Every existing surface that displays money reads from this one source.

Without this, every wallet screen stays a puppet. This is the highest-value
item and everything else depends on it.

### Phase B: Wallet setup flow (the missing origin story)

New `/wallet/setup`, modelled on upstream's onboarding step but in our
`OneWayFrame` language:

1. **Choose**: "Use the built-in Shopstr wallet" (Cashu/NIP-60, recommended) or
   "Connect an external Lightning wallet" (NWC).
2. **Built-in path**: pick a mint from a short list, confirm, land in `/wallet`
   with a zero balance and a designed empty state.
3. **NWC path**: paste the connection string, validated exactly as upstream
   does (prefix, 64-hex secret, relay param). Mock the connect result.
4. **Skip for now** is always available, matching upstream.

`/wallet` gates on this: if no wallet is set up, it shows a real empty state
with a "Set up your wallet" CTA instead of a fake balance.

### Phase C: Make send / receive / claim work

- Controlled inputs with real validation: amount > 0, amount ≤ balance,
  Lightning address or invoice shape-checked.
- Errors are inline and specific ("Not enough sats: you have 12,400"), never a
  generic red box.
- Success debits/credits the Phase A ledger, appends a transaction, and lands
  on the existing `check-draw` reward.
- `/wallet` activity list renders from real transactions and gets a designed
  empty state (it currently has one, but nothing ever changes it).

### Phase D: Settings that work

Restructure to match upstream's IA (which also kills two of our dead rows by
folding them where they belong):

| Row | Becomes |
|---|---|
| Profile & identity | `/settings/profile`, name, about, avatar, NIP-05 (controlled form + save) |
| Payouts | keep (already routes) |
| **Preferences** | `/settings/preferences`, hosts **Relays** (add/remove, read/write split), **Mints**, and **Saved addresses**, exactly like upstream |
| **Nostr Wallet Connect** | `/settings/wallet-connect`, paste + validate + connection state |
| **Keys & backup** | `/settings/keys`, show npub, reveal-on-confirm nsec, copy, download backup |
| Sign out | keep |
| ~~Saved addresses~~ | folded into Preferences |
| ~~Relays~~ | folded into Preferences |

Every row lands somewhere real. Any control that cannot work in a mock is not
shown at all, rather than shown broken.

### Phase E: Polish pass

The `<br />`-inside-`<span>` leading bug you spotted (already fixed on
`/wallet/payout` and the same pattern in `/checkout`), plus a sweep for any
other control that renders an affordance it does not honour.

## 4. Sequencing

A → B → C are strictly ordered (each depends on the previous). D is
independent and could run in parallel or first if settings matter more to you
than the wallet. E is continuous.

---

## Open questions

1. **Scope**: all five phases, or wallet-first (A/B/C) and settings later?
2. **Wallet model**: mirror upstream's dual model (built-in Cashu wallet *and*
   optional NWC external wallet), or simplify to just the built-in one for the
   prototype? Upstream has both; both is more faithful but roughly doubles
   Phase B.
3. **Settings IA**: adopt upstream's structure (folding Relays and Saved
   addresses into Preferences), or keep our flatter 8-row list and just give
   every row a real destination? I lean upstream, because it is the port target.
4. **Keys & backup**: we have no real keys (identity is mock npub/handle). Show
   a realistic npub + a masked nsec with reveal/copy that operates on mock
   values, or leave the row out until identity is real?
5. **Persistence**: should wallet balance and settings survive a page reload
   (localStorage, like upstream) or stay in-memory for the session? Upstream
   uses localStorage throughout; in-memory keeps our "mock data only" rule
   cleaner. I lean localStorage for settings, in-memory for the ledger.
6. **Sell flow**: `/sell/new` also has 4 uncontrolled inputs. In scope here or
   a separate pass?
