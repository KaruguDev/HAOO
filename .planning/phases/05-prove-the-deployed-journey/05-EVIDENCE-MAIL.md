# Phase 5 — LEAD-07 Mail-Chain Evidence

**The record for LEAD-07: does a uniquely tagged production submission reach `info@haoo.online`?**

LEAD-07 asks two things — that the HAOO form endpoint is **activated**, and that a tagged submission
is **delivered**. Neither is reachable until mail for `haoo.online` has a published exchanger. Those
are three distinct facts, and this file keeps them three distinct claims (05-CONTEXT.md **D-11**).

| Link | Claim | Status | Owning plan |
|---|---|---|---|
| 1 — MX | `haoo.online` publishes MX records naming the two PrivateEmail hosts, answering from two independent resolvers | **OPEN** | 05-02 (this plan) |
| 2 — Activation | FormSubmit's activation confirmation for `info@haoo.online` was received and confirmed; the endpoint's state is recorded | **NOT STARTED** | 05-06 |
| 3 — Delivery | A uniquely tagged production submission arrived, recorded with its tag, received timestamp and destination folder | **NOT STARTED** | 05-16 |

Why three and not one: FormSubmit's activation confirmation is emailed **to the very mailbox under
test**. Collapsing the chain into a single pass/fail would report *"mail did not arrive"* without
naming which link broke — the precise ambiguity D-11 exists to prevent. A reader of this file should
always be able to see which link is outstanding rather than infer it.

## Standing note on how this file is written

Every value in this file is **measured at the moment it is written** and is never cited from an
earlier session. This follows the 04.2 W-1 amendment: a stale-by-construction precondition is
re-measured, never quoted. Where a number appears here it is accompanied by the command that
produced it, that command's exit status, the resolver that answered, and the ISO-8601 UTC time of
the run.

Two corollaries that this file's own gates depend on:

- **An empty answer is a measurement, and is recorded as an explicitly empty answer** — never
  omitted. The gap between *"there are no records"* and *"nobody looked"* is exactly what this
  record exists to close.
- **A single resolver is not enough.** Two independent resolvers must both answer before link 1 is
  called confirmed (05-02 threat **T-05-07**; an executor may not clear this gate on its own
  judgment — 05-CONTEXT.md **D-10**).

This file carries DNS answers and timestamps only. Links 2 and 3 are bounded by **D-13** to the tag,
the received timestamp and the destination folder — no mailbox contents and no credentials enter a
public repository (threat **T-05-08**).

---

## Link 1 — MX

**Status: OPEN** — pre-change state measured; the zone publishes no MX records.

### The owner's recorded decision

From `.planning/REQUIREMENTS.md` (the deferred-items table, "Mail routing for `haoo.online`"), the
decision recorded on **2026-09-05**:

> Owner decision recorded 2026-09-05: point MX at `mx1.privateemail.com` / `mx2.privateemail.com`.
> **The DNS change was deliberately scoped out of this phase.**

| | |
|---|---|
| **Decision** | MX for the apex `haoo.online` → `mx1.privateemail.com` and `mx2.privateemail.com` |
| **Recorded** | 2026-09-05 |
| **State** | **DECIDED, NOT EXECUTED** |
| **Owner** | repository owner |
| **Carried to** | Phase 5 / LEAD-07 |

The decision and its execution are stated separately and on purpose. A requirements table can record
that a choice was made; it cannot record that anything was done. Holding those apart in this file
makes the gap visible to a reader who has only this file in front of them.

Also carried forward, unchanged: `04.2-VERIFICATION.md` §"Human Verification Outcome" **item 4 —
STILL OPEN, and deliberately so**. That is why no sentence written in phase 04.2 claims mail arrives
anywhere.

### Pre-change measurement

**Run at `2026-09-07T18:50:29Z` (UTC).** Executed from the HAOO checkout on the operator's machine.

Resolvers used, and why they are independent:

| Label | Address | Path |
|---|---|---|
| local resolver | `127.0.0.53` (systemd-resolved stub) | forwards to the LAN gateway `192.168.100.1` / `fe80::1` → that network's upstream |
| public resolver | `8.8.8.8` | Google Public DNS, a wholly separate recursive service |

#### `dig +short MX haoo.online` — local resolver

```
$ dig +short MX haoo.online
(no output — the answer was EXPLICITLY EMPTY)
rc=0
```

**Exit status 0 with zero lines of output.** The query succeeded and the answer contained no MX
record. This is a measurement, not a failure to measure.

#### `dig +short MX haoo.online @8.8.8.8` — public resolver

```
$ dig +short MX haoo.online @8.8.8.8
(no output — the answer was EXPLICITLY EMPTY)
rc=0
```

**Exit status 0 with zero lines of output.** Both independent resolvers agree.

#### Corroboration: the full response, so "empty" cannot be read as "lookup failed"

`+short` cannot distinguish an empty answer from a broken lookup, so the same query was re-run at
`2026-09-07T18:50:38Z` and `2026-09-07T18:50:54Z` with the header and authority sections intact.

Local resolver:

```
$ dig MX haoo.online +noall +comments +answer +authority
;; communications error to 127.0.0.53#53: timed out
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30890
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; AUTHORITY SECTION:
haoo.online.		1800	IN	SOA	dns1.registrar-servers.com. hostmaster.registrar-servers.com. 1788640971 43200 3600 604800 3601

rc=0
```

Public resolver:

```
$ dig MX haoo.online @8.8.8.8 +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 37598
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; AUTHORITY SECTION:
haoo.online.		1800	IN	SOA	dns1.registrar-servers.com. hostmaster.registrar-servers.com. 1788640971 43200 3600 604800 3601

rc=0
```

Both responses read **`status: NOERROR`** with **`ANSWER: 0`** and a returned SOA. That is the
authoritative signature of *"this zone exists, this name exists, and it has no records of this
type"* — an NXDOMAIN or a SERVFAIL would mean something else entirely. The measurement is that the
MX set is genuinely empty, not that the question could not be asked.

The line `;; communications error to 127.0.0.53#53: timed out` is recorded verbatim rather than
cleaned up: the local stub resolver timed out on the first attempt and `dig` succeeded on its retry.
It changes nothing about the answer — the retried response is the one shown, and `8.8.8.8` answered
identically on its first attempt — but a transcript that quietly drops a timeout is not a verbatim
transcript.

#### `dig +short A haoo.online` — the record mail currently falls back to

```
$ dig +short A haoo.online
185.199.108.153
185.199.111.153
185.199.109.153
185.199.110.153
rc=0
```

Four addresses, exit status 0. These are the GitHub Pages address set (`185.199.108.153`,
`185.199.109.153`, `185.199.110.153`, `185.199.111.153`); `dig` returns them in rotated order per
query, so the ordering above carries no meaning. **These four addresses serve the website and must
survive the MX change untouched** (threat **T-05-06**).

#### Delegation, recorded so the change is made in the right place

```
$ dig +short NS haoo.online
dns2.registrar-servers.com.
dns1.registrar-servers.com.
rc=0
```

The zone is served by `registrar-servers.com` — Namecheap's BasicDNS. This is the zone that must be
edited, and it is the same zone already carrying the four A records above.

### What this measurement means

Under **RFC 5321 §5.1**, a domain with no MX record falls back to its **implicit MX**: the address
record itself. So mail addressed to `info@haoo.online` is, as of the timestamp above, directed at
`185.199.108.153` and its three siblings — GitHub Pages, which serves HTTP and **runs no SMTP
listener at all**.

The operational conclusion, stated as a measurement rather than a certainty: mail sent to
`info@haoo.online` at this moment has no server willing to accept it, and almost certainly does not
arrive. This matters beyond LEAD-07's test submission — `info@haoo.online` is also the qualification
form's fallback target, the `mailto:` onboarding link, and a `noscript` recovery link.

It also means **link 2 is currently unreachable, not merely unstarted**: FormSubmit's activation
confirmation is emailed to `info@haoo.online` itself, so the endpoint cannot be activated until this
link closes.

### Post-change measurement

**Not yet taken.** Awaiting the blocking human checkpoint (05-02 task 2, `gate="blocking-human"`):
the two MX records must be added to the `haoo.online` zone by the repository owner. This section
will carry both resolvers' verbatim answers, their exit statuses, the priority values the owner
reported, the time the owner saved the change, and the ISO-8601 UTC time of the re-measurement.

Link 1 is closed only when **both** resolvers return a non-empty answer naming **both**
`mx1.privateemail.com` and `mx2.privateemail.com`. A single-resolver answer does not close it. An
answer naming some other host does not close it — "some MX is better than none" is not the claim
being made (threat **T-05-05**). If either resolver still answers empty, the measured answers are
recorded here and link 1 stays **OPEN**; propagation being plausibly slow is not evidence that it
landed.

---

## Link 2 — Activation

**Status: NOT STARTED.** Owned by plan **05-06**, which appends here.

Blocked on link 1. FormSubmit's activation confirmation for `https://formsubmit.co/ajax/info@haoo.online`
is emailed to `info@haoo.online`, so with no published exchanger there is no way to receive it and
therefore no way to activate the endpoint.

To be recorded when taken: that the activation mail was received and confirmed, the endpoint's
resulting state, and the ISO-8601 UTC timestamp of each observation.

---

## Link 3 — Delivery

**Status: NOT STARTED.** Owned by plan **05-16**, which appends here.

Blocked on link 2. A tagged submission sent through an unactivated endpoint proves nothing about
delivery, which is the ordering trap 05-RESEARCH.md §"Pitfall 9" names.

To be recorded when taken, per **D-13**: the unique release-verification tag (fixed *before* sending,
per **D-12**), the received timestamp, and the destination folder. **Arrival in the spam folder
counts as a pass** — LEAD-07 says "inbox or spam folder" — **but is recorded AS spam and never
silently normalised to "received".**

---

## Restart rule

This chain is strictly serial and single-operator. Nothing mechanically prevents a second operator
from changing an MX record, or sending a second submission, while the chain is in flight; the
mitigation is that every link records its own measurement timestamp, so an interleaved run is
*visible* in this record even though it is not prevented.

**If the chain is interrupted between links, it restarts from link 1 with a fresh `dig`** — never
resumed from a value recorded here. A recorded measurement is evidence of what was true when it was
taken, and is never a precondition for what happens next.

---

*Phase: 05-prove-the-deployed-journey*
*Link 1 opened by plan 05-02, 2026-09-07*
