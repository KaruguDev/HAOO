# Phase 5 — LEAD-07 Mail-Chain Evidence

**The record for LEAD-07: does a uniquely tagged production submission reach `info@haoo.online`?**

LEAD-07 asks two things — that the HAOO form endpoint is **activated**, and that a tagged submission
is **delivered**. Neither is reachable until mail for `haoo.online` has a published exchanger. Those
are three distinct facts, and this file keeps them three distinct claims (05-CONTEXT.md **D-11**).

| Link | Claim | Status | Owning plan |
|---|---|---|---|
| 1 — MX | `haoo.online` publishes MX records naming the two PrivateEmail hosts, answering from two independent resolvers | **CONFIRMED** (`2026-09-12T21:03:51Z`; re-measured `2026-09-13T00:06:36Z`) | 05-02 (this plan) |
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

**Status: CONFIRMED** — at `2026-09-12T21:03:51Z` the local resolver and `8.8.8.8` both answered with `10 mx1.privateemail.com.` and `10 mx2.privateemail.com.`, after ten consecutive agreeing rounds from `21:02:44Z` to `21:03:30Z`. Delivery is not part of this link.

Status history: **OPEN** at `2026-09-07T18:50:29Z` (no MX published) · **OPEN** at `2026-09-12T20:40:04Z` (both named resolvers empty) · **CONFIRMED** at `2026-09-12T21:03:51Z` · re-measured at `2026-09-13T00:06:36Z` after the executor was interrupted, both named resolvers naming both hosts (see *Post-interruption re-measurement*).

### The owner's recorded decision

From `.planning/REQUIREMENTS.md` (the deferred-items table, "Mail routing for `haoo.online`"), the
decision recorded on **2026-09-05**:

> Owner decision recorded 2026-09-05: point MX at `mx1.privateemail.com` / `mx2.privateemail.com`.
> **The DNS change was deliberately scoped out of this phase.**

| | |
|---|---|
| **Decision** | MX for the apex `haoo.online` → `mx1.privateemail.com` and `mx2.privateemail.com` |
| **Recorded** | 2026-09-05 |
| **State** | **DECIDED, NOT EXECUTED** as of `2026-09-07`; executed by the owner on 2026-09-12 (see *What the owner did, as reported*) |
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

### Closing rule, as written before the post-change measurement was taken

Link 1 is closed only when **both** resolvers return a non-empty answer naming **both**
`mx1.privateemail.com` and `mx2.privateemail.com`. A single-resolver answer does not close it. An
answer naming some other host does not close it — "some MX is better than none" is not the claim
being made (threat **T-05-05**). If either resolver still answers empty, the measured answers are
recorded here and link 1 stays **OPEN**; propagation being plausibly slow is not evidence that it
landed.

### What the owner did, as reported

| | |
|---|---|
| **Owner's report** | *"done MX records added for haoo.online"* — 2026-09-12 (05-02 task 2, `gate="blocking-human"`) |
| **Where the records were added** | The Cloudflare dashboard for the `haoo.online` zone. By 2026-09-12 the zone was no longer delegated to Namecheap BasicDNS (see *Zone changes since the pre-change measurement* below). The orchestrator corrected the owner's instructions before the owner acted, because records added at Namecheap would not have been served |
| **Priority values** | **Not reported separately by the owner.** The values `10` and `10` below are **as measured** from the DNS answer, not as reported |
| **Time the change was saved** | **Not reported.** The earliest non-empty answer known to this record is the orchestrator's measurement at `2026-09-12T20:34:00Z` (local, `1.1.1.1`, `bella.ns.cloudflare.com`, `oswald.ns.cloudflare.com`), with `8.8.8.8` following at `2026-09-12T20:34:50Z`. Those two values are the orchestrator's, quoted as such; every value in the sections below was measured by the executor writing this section |

### Post-change measurement — first run: both named resolvers empty

**Run at `2026-09-12T20:40:04Z` (UTC).** Same checkout, same machine as the pre-change run.

```
$ dig +short MX haoo.online
(no output — EXPLICITLY EMPTY)
rc=0

$ dig +short MX haoo.online @8.8.8.8
(no output — EXPLICITLY EMPTY)
rc=0

$ dig +short MX haoo.online @1.1.1.1
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @bella.ns.cloudflare.com
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @oswald.ns.cloudflare.com
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0
```

The two resolvers this plan names answered empty; `1.1.1.1` and both authoritative servers named
both hosts. The full responses from the two named resolvers, same second:

```
$ dig MX haoo.online +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 33004
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; AUTHORITY SECTION:
haoo.online.		1294	IN	SOA	bella.ns.cloudflare.com. dns.cloudflare.com. 2414638242 10000 2400 604800 1800
rc=0

$ dig MX haoo.online @8.8.8.8 +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 8452
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; AUTHORITY SECTION:
haoo.online.		1294	IN	SOA	bella.ns.cloudflare.com. dns.cloudflare.com. 2414638242 10000 2400 604800 1800
rc=0
```

Both are `NOERROR`, `ANSWER: 0`, carrying a **cached** SOA with serial `2414638242` and `1294` seconds of
negative-cache life left out of the zone's `1800`-second SOA minimum. Queried directly in the same
run, the authoritative SOA read serial `2414730886`:

```
$ dig +short SOA haoo.online @8.8.8.8
bella.ns.cloudflare.com. dns.cloudflare.com. 2414730886 10000 2400 604800 1800
rc=0
```

Link 1 was left **OPEN** on this run.

### Post-change measurement — the interval in which answers alternated

From `20:40:40Z` the two named resolvers began returning **different answers to identical queries
seconds apart**: some queries hit a cache holding the new MX set, others a cache still holding the
empty answer. At `2026-09-12T20:40:40Z`:

```
$ dig MX haoo.online +noall +comments +answer +authority
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 9174
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1
;; ANSWER SECTION:
haoo.online.		266	IN	MX	10 mx2.privateemail.com.
haoo.online.		266	IN	MX	10 mx1.privateemail.com.
rc=0

$ dig MX haoo.online @8.8.8.8 +noall +comments +answer +authority
;; communications error to 8.8.8.8#53: timed out
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 6797
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1
;; AUTHORITY SECTION:
haoo.online.		1253	IN	SOA	bella.ns.cloudflare.com. dns.cloudflare.com. 2414638242 10000 2400 604800 1800
rc=0

$ dig MX haoo.online @8.8.4.4 +noall +comments +answer +authority
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10882
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 1
;; AUTHORITY SECTION:
haoo.online.		1253	IN	SOA	bella.ns.cloudflare.com. dns.cloudflare.com. 2414638242 10000 2400 604800 1800
rc=0
```

(The `OPT PSEUDOSECTION` lines, identical in form to those above, are omitted from this block only.)
At `20:41:43Z` a single `8.8.8.8` query returned both hosts with a fresh TTL of `300` (its transcript
is not reproduced in this file).

Six back-to-back rounds, `dig +short MX` against each resolver, answer lines joined on one row:

| UTC | local resolver | `8.8.8.8` |
|---|---|---|
| `20:41:56Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | EXPLICITLY EMPTY |
| `20:41:56Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | EXPLICITLY EMPTY |
| `20:41:57Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `;; communications error to 8.8.8.8#53: timed out` then `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| `20:42:02Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` |
| `20:42:02Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| `20:42:02Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | EXPLICITLY EMPTY |

A one-per-minute poll of the same two commands, every `rc=0`:

| UTC | local resolver | `8.8.8.8` |
|---|---|---|
| `20:41:06Z` | `10 mx2…` `10 mx1…` | EXPLICITLY EMPTY |
| `20:42:06Z` | `10 mx2…` `10 mx1…` | EXPLICITLY EMPTY |
| `20:43:06Z` | `10 mx1…` `10 mx2…` | EXPLICITLY EMPTY |
| `20:44:06Z` | `10 mx2…` `10 mx1…` | EXPLICITLY EMPTY |
| `20:45:06Z` | EXPLICITLY EMPTY | `10 mx1…` `10 mx2…` |
| `20:46:07Z` | EXPLICITLY EMPTY | `10 mx2…` `10 mx1…` |
| `20:47:07Z` | `10 mx1…` `10 mx2…` | `10 mx2…` `10 mx1…` |

(`mx1…` / `mx2…` abbreviate `mx1.privateemail.com.` / `mx2.privateemail.com.` in this table only.)

The `20:47:07Z` row names both hosts from both resolvers, but it sits directly after rows in which
each resolver answered empty. **Link 1 was not closed on it.** A single agreeing round inside an
interval of alternating answers is a single-query observation, and the closing rule above does not
accept one. Instead, the measurement was repeated only after the latest-expiring negative-cache entry seen had run out
(`1294` s remaining at `20:40:04Z` on both named resolvers, so expiring at about `21:01:38Z`; the
`1253` s entry seen on `8.8.8.8` at `20:40:40Z` expires at about `21:01:33Z`), and required ten
consecutive agreeing rounds.

### Post-change measurement — closing series: ten consecutive rounds

**Started `2026-09-12T21:02:44Z`, ended `2026-09-12T21:03:30Z`.** Rounds about five seconds apart (six between rounds 4 and 5); in each,
`dig +short MX haoo.online` then `dig +short MX haoo.online @8.8.8.8`. Every command exited `rc=0`.
Answer lines as returned, in returned order:

| Round | UTC | local resolver | `8.8.8.8` |
|---|---|---|---|
| 1 | `21:02:44Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 2 | `21:02:49Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 3 | `21:02:54Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 4 | `21:02:59Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 5 | `21:03:05Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` |
| 6 | `21:03:10Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 7 | `21:03:15Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` |
| 8 | `21:03:20Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` |
| 9 | `21:03:25Z` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` | `10 mx1.privateemail.com.` `10 mx2.privateemail.com.` |
| 10 | `21:03:30Z` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` | `10 mx2.privateemail.com.` `10 mx1.privateemail.com.` |

Ten of ten rounds: both resolvers non-empty, both naming both hosts, no empty answer anywhere in the
series.

**A separate watch, run by the orchestrator (not part of the executor's series above).** From
`2026-09-12T21:03:00Z` the orchestrator ran its own poller in a different process. It required ten
consecutive rounds, each querying `@8.8.8.8` and the local resolver, with both hosts in both answers.
It reached ten at `2026-09-12T21:06:05Z`, with final answers `8.8.8.8: 10 mx1.privateemail.com. 10
mx2.privateemail.com.` and `local: 10 mx1.privateemail.com. 10 mx2.privateemail.com.`. The
orchestrator's spot check at `2026-09-13T00:04Z` returned the same from both. These are the
orchestrator's values as the orchestrator reported them. The executor writing this file did not
re-run them.

### Post-change measurement — closing run, recorded in full

**Run at `2026-09-12T21:03:51Z` (UTC).**

```
$ dig +short MX haoo.online
10 mx2.privateemail.com.
10 mx1.privateemail.com.
rc=0

$ dig +short MX haoo.online @8.8.8.8
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @1.1.1.1
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @bella.ns.cloudflare.com
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @oswald.ns.cloudflare.com
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig MX haoo.online +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 57602
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; ANSWER SECTION:
haoo.online.		180	IN	MX	10 mx1.privateemail.com.
haoo.online.		180	IN	MX	10 mx2.privateemail.com.
rc=0

$ dig MX haoo.online @8.8.8.8 +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 9752
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; ANSWER SECTION:
haoo.online.		179	IN	MX	10 mx2.privateemail.com.
haoo.online.		179	IN	MX	10 mx1.privateemail.com.
rc=0

$ dig +short A mx1.privateemail.com
162.255.118.7
rc=0

$ dig +short A mx2.privateemail.com
162.255.118.8
rc=0
```

| Resolver | Answer (hosts sorted; returned order is in the block above) | Exit |
|---|---|---|
| local resolver (`127.0.0.53` stub; `resolvectl` at `20:40:40Z` listed current server `192.168.100.1`, servers `192.168.100.1 1.1.1.1 fe80::1`) | `10 mx1.privateemail.com.`, `10 mx2.privateemail.com.` | `0` |
| `8.8.8.8` (Google Public DNS) | `10 mx1.privateemail.com.`, `10 mx2.privateemail.com.` | `0` |
| `1.1.1.1` (Cloudflare public resolver) | `10 mx1.privateemail.com.`, `10 mx2.privateemail.com.` | `0` |
| `bella.ns.cloudflare.com` (authoritative) | `10 mx1.privateemail.com.`, `10 mx2.privateemail.com.` | `0` |
| `oswald.ns.cloudflare.com` (authoritative) | `10 mx1.privateemail.com.`, `10 mx2.privateemail.com.` | `0` |

Both MX targets resolve to an address: `mx1.privateemail.com` → `162.255.118.7`, `mx2.privateemail.com` →
`162.255.118.8`.

On the independence of the two named resolvers: during the empty first run, both returned the same
cached SOA serial (`2414638242`) with the same remaining TTL (`1294`); at `20:40:40Z` they diverged
(local non-empty at TTL `266`, `8.8.8.8` empty at TTL `1253`). The local path's upstream beyond
`192.168.100.1` is not visible from this machine. The two are recorded as two separately-queried
resolvers, and `1.1.1.1` plus both authoritative servers are recorded beside them.

### Zone changes since the pre-change measurement — not caused by the MX edit

Two facts recorded in the pre-change run on `2026-09-07` no longer describe the zone. Neither is
evidence of damage from adding MX records: both follow from the zone having moved from Namecheap
BasicDNS to Cloudflare with the website proxied through Cloudflare. **When the delegation moved is
not known from inside this plan.** The earliest Cloudflare observation this repository records for
`www.haoo.online` is 05-14's `server: cloudflare` reading at `2026-09-12T20:29:26Z` (STATE.md, AG-O1),
which is still later than `2026-09-07T18:50:29Z` and bounds nothing earlier.

**1. Delegation.** Run at `2026-09-12T21:03:51Z`:

```
$ dig +short NS haoo.online
bella.ns.cloudflare.com.
oswald.ns.cloudflare.com.
rc=0

$ dig +short NS haoo.online @8.8.8.8
bella.ns.cloudflare.com.
oswald.ns.cloudflare.com.
rc=0
```

Pre-change (`2026-09-07T18:50:29Z`): `dns1.registrar-servers.com.` / `dns2.registrar-servers.com.`. The SOA
mname moved with it, from `dns1.registrar-servers.com.` (serial `1788640971`, minimum `3601`) to
`bella.ns.cloudflare.com.` (serial `2414730886`, minimum `1800`).

**2. Apex and `www` address records.** Run at `2026-09-12T21:03:51Z`:

```
$ dig +short A haoo.online
172.67.164.26
104.21.65.146
rc=0

$ dig +short A haoo.online @8.8.8.8
104.21.65.146
172.67.164.26
rc=0

$ dig +short A www.haoo.online
172.67.164.26
104.21.65.146
rc=0
```

**Two** addresses, both in Cloudflare's proxy ranges. Pre-change: **four**, the GitHub Pages set
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. The plan's task 3 assertion that
`dig +short A haoo.online` *"still returns the four GitHub Pages addresses"* does not describe this
zone any more: its automated check `test "$(dig +short A haoo.online | wc -l)" -eq 4` measured `2`
and exited `1` at `2026-09-12T21:03:53Z`. That is recorded here as measured, not rewritten into a
different criterion.

What the four-address assertion existed to protect (threat **T-05-06**) is that the website keeps
serving. Measured at `2026-09-12T21:03:52Z`:

```
$ curl -sSI https://haoo.online/
HTTP/2 301
location: https://www.haoo.online/
server: cloudflare

$ curl -sSI https://www.haoo.online/
HTTP/2 200
server: cloudflare

$ curl -sSL https://www.haoo.online/ | grep -oE '/assets/haoo-[A-Za-z0-9_-]+\.js'
/assets/haoo-C1OXjuEM.js
```

The apex redirects to `www`, which answers `200` from Cloudflare with a HAOO bundle. The bundle name
differs from the `/assets/haoo-D1dl6F2P.js` the orchestrator observed earlier on `2026-09-12`; a HAOO
deploy was pushed in between, which accounts for a new content hash and has nothing to do with DNS.

`dig +short TXT haoo.online @8.8.8.8` answered EXPLICITLY EMPTY (`rc=0`) at `21:03:51Z`: the zone
publishes no SPF record. This plan does not require one, and link 1's claim is about MX only. It is
recorded because an absent SPF can affect whether mail *from* `haoo.online` is accepted elsewhere,
which is outside this link.

### Post-interruption re-measurement

The executor that took the measurements above was stopped by an API spend limit after writing this
section and before committing it. Its poller processes did not survive that stop. Under the
*Restart rule* below, nothing above was carried forward as a precondition. The two named resolvers
were queried again by the executor resuming the plan.

**Run at `2026-09-13T00:06:36Z` (UTC).** Same checkout, same machine.

```
$ dig +short MX haoo.online
10 mx1.privateemail.com.
10 mx2.privateemail.com.
rc=0

$ dig +short MX haoo.online @8.8.8.8
10 mx2.privateemail.com.
10 mx1.privateemail.com.
rc=0

$ dig MX haoo.online +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 32706
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; ANSWER SECTION:
haoo.online.		299	IN	MX	10 mx2.privateemail.com.
haoo.online.		299	IN	MX	10 mx1.privateemail.com.
rc=0

$ dig MX haoo.online @8.8.8.8 +noall +comments +answer +authority
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 36799
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; ANSWER SECTION:
haoo.online.		300	IN	MX	10 mx2.privateemail.com.
haoo.online.		300	IN	MX	10 mx1.privateemail.com.
rc=0

$ dig +short NS haoo.online
bella.ns.cloudflare.com.
oswald.ns.cloudflare.com.
rc=0

$ dig +short NS haoo.online @8.8.8.8
oswald.ns.cloudflare.com.
bella.ns.cloudflare.com.
rc=0

$ dig +short A haoo.online
172.67.164.26
104.21.65.146
rc=0

$ dig +short A haoo.online @8.8.8.8
172.67.164.26
104.21.65.146
rc=0
```

Both named resolvers answered non-empty, and each named both `mx1.privateemail.com` and
`mx2.privateemail.com`. NS and the apex A set match the `2026-09-12T21:03:51Z` readings under *Zone
changes since the pre-change measurement*.

The plan's task 3 automated check was run unmodified at `2026-09-13T00:06:39Z`, then clause by clause:

```
$ test -n "$(dig +short MX haoo.online)" && dig +short MX haoo.online | grep -q 'mx1.privateemail.com' && dig +short MX haoo.online @8.8.8.8 | grep -q 'mx2.privateemail.com' && test "$(dig +short A haoo.online | wc -l)" -eq 4
verify_exit=1

clause 1  test -n "$(dig +short MX haoo.online)"                           exit 0
clause 2  dig +short MX haoo.online | grep -q 'mx1.privateemail.com'        exit 0
clause 3  dig +short MX haoo.online @8.8.8.8 | grep -q 'mx2.privateemail.com'  exit 0
clause 4  dig +short A haoo.online | wc -l                                  2 (the check requires 4)
```

The three MX clauses exit `0`. The chain exits `1` on clause 4 alone, for the reason recorded above:
the apex now resolves to two Cloudflare proxy addresses instead of the four GitHub Pages addresses.
The MX edit did not change the A set. The check is recorded as it ran and was not rewritten.

### Owner amendment to the task 3 check

The run at `2026-09-13T00:06:39Z` exited `1` on clause 4 alone, recorded above and logged as
`.planning/WINDOWS.md` #36. On 2026-09-13 the owner was asked whether to amend that clause, keep it,
or take `haoo.online` off the Cloudflare proxy, and chose to amend it to what it was guarding: that
the website still serves after the MX edit (threat T-05-06).

- **Retired clause 4:** `test "$(dig +short A haoo.online | wc -l)" -eq 4`. It counted the four GitHub
  Pages addresses, which stopped describing the zone once `haoo.online` moved behind the Cloudflare
  proxy.
- **Replacement:** `https://haoo.online/` returns `301`, `https://www.haoo.online/` returns `200`,
  and the served document references a `/assets/haoo-` bundle.

Measured by the orchestrator at `2026-09-13T00:14:43Z`: `http://haoo.online/` → `301`, location
`https://www.haoo.online/`; `https://haoo.online/` → `301`, location `https://www.haoo.online/`;
`https://www.haoo.online/` → `200`, bundle `/assets/haoo-C1OXjuEM.js`. Apex A answer
`104.21.65.146 172.67.164.26`; MX `10 mx1.privateemail.com.` `10 mx2.privateemail.com.`.

The amended check, run in full at `2026-09-13T00:15:46Z`:

```
$ test -n "$(dig +short MX haoo.online)" && dig +short MX haoo.online | grep -q 'mx1.privateemail.com' && dig +short MX haoo.online @8.8.8.8 | grep -q 'mx2.privateemail.com' && test "$(curl -s -o /dev/null -w '%{http_code}' https://haoo.online/)" = 301 && test "$(curl -s -o /dev/null -w '%{http_code}' https://www.haoo.online/)" = 200 && curl -s https://www.haoo.online/ | grep -q '/assets/haoo-'
exit 0
```

Link 1's status is unchanged by this amendment: it was CONFIRMED on the MX clauses, which are identical
before and after.

### What link 1 does and does not establish

**It establishes** that the `haoo.online` zone publishes an MX set naming `mx1.privateemail.com` and
`mx2.privateemail.com` at priority `10`, answered by the local resolver and by `8.8.8.8` in ten
consecutive rounds and in a full closing run, and that both exchanger names resolve.

**It does not establish delivery.** DNS says where mail should go. It says nothing about whether a
mailbox named `info@haoo.online` exists in the owner's Namecheap Private Email account, or whether
that account accepts mail for `haoo.online`. Neither was measured here, and nothing was sent. Those
are exercised by links 2 and 3.

**The consequence:** FormSubmit's activation confirmation is emailed to `info@haoo.online` itself,
so link 2 was unreachable until this moment. As of `2026-09-12T21:03:51Z` mail for `haoo.online` has a
published exchanger, and link 2 (plan 05-06) can be attempted.

---

## Link 2 — Activation

**Status: NOT STARTED.** Owned by plan **05-06**, which appends here.

Was blocked on link 1, which reads CONFIRMED as of `2026-09-12T21:03:51Z`. Plan 05-06 re-measures MX before relying on it (see *Restart rule*). FormSubmit's activation confirmation for `https://formsubmit.co/ajax/info@haoo.online`
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
*Link 1 opened by plan 05-02, 2026-09-07; post-change measurement and link 1 status recorded by plan 05-02, 2026-09-12; re-measured after interruption 2026-09-13*
