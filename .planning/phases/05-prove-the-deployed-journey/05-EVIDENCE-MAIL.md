# Phase 5 — LEAD-07 Mail-Chain Evidence

**The record for LEAD-07: does a uniquely tagged production submission reach `info@haoo.online`?**

LEAD-07 asks two things — that the HAOO form endpoint is **activated**, and that a tagged submission
is **delivered**. Neither is reachable until mail for `haoo.online` has a published exchanger. Those
are three distinct facts, and this file keeps them three distinct claims (05-CONTEXT.md **D-11**).

**Chain summary, closed 2026-09-13 by plan 05-16:**

- Link 1, MX: **CONFIRMED** at `2026-09-12T21:03:51Z`. Last re-measured `2026-09-13T01:11:43.608Z`, just before the release send.
- Link 2, Activation: **CONFIRMED** on the owner's report (2026-09-13). The marked activation-trigger message corroborates it, delivered with header `Sun, 13 Sep 2026 00:33:02 +0000`.
- Link 3, Delivery: **CONFIRMED** on the owner's report (2026-09-13). Marker `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`, sent `2026-09-13T01:11:46.454Z`, received "Today 04:11" as the owner's mail client shows it (01:11 UTC). The folder was **inbox**.
- Live submissions sent in Phase 5: **2**. They are `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` (05-06) and `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` (05-16), one message each.

| Link | Claim | Status | Owning plan |
|---|---|---|---|
| 1 — MX | `haoo.online` publishes MX records naming the two PrivateEmail hosts, answering from two independent resolvers | **CONFIRMED** (`2026-09-12T21:03:51Z`; re-measured `2026-09-13T00:06:36Z`) | 05-02 (this plan) |
| 2 — Activation | FormSubmit's activation confirmation for `info@haoo.online` was received and confirmed; the endpoint's state is recorded | **CONFIRMED** on the owner's report (`2026-09-13`, "activated form submit"), corroborated by delivery of the marked activation-trigger submission at `00:33:02 +0000`; folder, full sender and post-click page text not stated | 05-06 |
| 3 — Delivery | A uniquely tagged production submission arrived, recorded with its tag, received timestamp and destination folder | **CONFIRMED** on the owner's mailbox report (2026-09-13). The tagged submission `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` was sent `2026-09-13T01:11:46.454Z` as 1 message, with the marker committed first in `49c976a`. It was received "Today 04:11" as the owner's mail client shows it (01:11 UTC), folder **inbox**. The full sender and subject are not stated: both are cut off in the owner's screenshot | 05-16 |

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

**Status: CONFIRMED** — on the **owner's report**, in their words: *"activated form submit and received 3 submissions"* (2026-09-13). The owner's statement is what authorises this status. It is **corroborated**, not replaced, by FormSubmit delivering this plan's marked activation-trigger submission (`HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a`, sent `2026-09-13T00:30:34.768Z`) with a message header of `Sun, 13 Sep 2026 00:33:02 +0000`. The owner did **not** state the folder (inbox or spam), the full sender address, or the page text after clicking the activation link, so none of these is recorded (see *Owner's mailbox report*). Link 3 is not closed by anything here.

Status history: **NOT STARTED** until `2026-09-13T00:30:34Z` · **AWAITING OWNER CONFIRMATION** from `2026-09-13T00:30:34.768Z` (plan 05-06 Task 2) · **CONFIRMED** on the owner's report received 2026-09-13 (plan 05-06 Task 3).

Was blocked on link 1, which reads CONFIRMED as of `2026-09-12T21:03:51Z`. FormSubmit's activation confirmation for `https://formsubmit.co/ajax/info@haoo.online`
is emailed to `info@haoo.online`, so with no published exchanger there was no way to receive it and
therefore no way to activate the endpoint.

### Owner-reported precondition: the mailbox exists

Asked directly before the send, the owner reported that `info@haoo.online` exists in their Namecheap
Private Email account and that they can log in to read its inbox and its spam folder. This is
**owner-reported**, not measured: nothing in this repository can observe the mailbox.

### MX re-measured before relying on link 1 (*Restart rule*)

Link 1's recorded value was not relied on. MX was measured fresh twice by plan 05-06, with
`DiG 9.18.39-0ubuntu0.24.04.7-Ubuntu`, from this workstation's local resolver and from `8.8.8.8`:

| When (UTC) | Why | `dig +short MX haoo.online` (local), exit | `dig +short MX haoo.online @8.8.8.8`, exit |
|---|---|---|---|
| `2026-09-13T00:15:07Z` | Task 1 precondition | `10 mx2.privateemail.com.` / `10 mx1.privateemail.com.`, exit 0 | `10 mx1.privateemail.com.` / `10 mx2.privateemail.com.`, exit 0 |
| `2026-09-13T00:30:30Z` | Immediately before the send; the send command was gated on both answers naming both hosts | `10 mx1.privateemail.com.` / `10 mx2.privateemail.com.`, exit 0 | `10 mx2.privateemail.com.` / `10 mx1.privateemail.com.`, exit 0 |

Order within an answer varies between queries; both hosts at preference 10 appeared in all four answers.

### The mechanism, and proof it sends nothing by default

`e2e/live-submission.e2e.ts` (commit `9a2b00d`) is the only spec that lets a request reach the form
provider. Its whole describe block is skipped unless `HAOO_SEND_LIVE_SUBMISSION` is non-empty. When
armed it also requires `HAOO_LIVE_SUBMISSION_PURPOSE`, runs on the `live` project only, pins retries
to 0 (overriding the `live` project's `retries: 2`), and refuses to start on a retry or repeat index.

Unarmed runs, flag unset, measured:

| Run (UTC) | Command | Exit | This spec's reported status | Totals |
|---|---|---|---|---|
| between `00:15:07Z` and `00:19:27Z` (not timestamped individually) | `npx playwright test --project=live e2e/live-submission.e2e.ts` | 0 | skipped | 1 skipped |
| between `00:15:07Z` and `00:19:27Z` (not timestamped individually) | `npx playwright test --project=preview e2e/live-submission.e2e.ts` | 0 | skipped | 1 skipped |
| `00:19:27Z`–`00:23:07Z` | `npm run test:e2e:live` | 0 | skipped (list reporter, test 31) | 128 passed, 14 skipped |
| `00:24:09Z`–`00:27:57Z` | The plan's Task 1 verify chain (typecheck, lint, `npm run test:e2e:live`) | 0 each | JSON reporter: `status: "skipped"`, `expectedStatus: "skipped"`, one result at `retry: 0`, skip annotation `HAOO_SEND_LIVE_SUBMISSION is unset: this spec sends real mail to info@haoo.online and is inert by default` | 128 expected, 14 skipped, 0 unexpected, 0 flaky |

After each unarmed run `evidence/live-submission.json` did not exist. That file is written only from
inside the test body, so its absence shows the body never ran. In each of the two full live runs, the
specs that drive the form on live route `formsubmit.co` to abort. Each run wrote four live records
carrying `providerAttemptCount` (three in `evidence/form-states.json`, one in
`evidence/keyboard-script-focus.json`, S1), and all eight read `0`. Those appended records were
restored to HEAD after being read, because a guard-proof run must not replace other plans' committed
evidence. The test title as reported:
`[live] › e2e/live-submission.e2e.ts:236:3 › LIVE SUBMISSION — one real submission through the shipped form on the live origin › sends exactly one marked submission and records what the browser observed`.

### The single activation-trigger submission — what the browser observed

One armed run, started `2026-09-13T00:30:30.546Z`, ended `00:30:40.659Z`, exit 0:

`HAOO_SEND_LIVE_SUBMISSION=1 HAOO_LIVE_SUBMISSION_PURPOSE=ENDPOINT-ACTIVATION npx playwright test --project=live e2e/live-submission.e2e.ts --retries=0 --workers=1 --reporter=list`

It was not retried and no other armed run was made. Values below are transcribed from
`evidence/live-submission.json` (two records) and the run's own output line.

| Reading | Value |
|---|---|
| Marker, generated and sent | `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` |
| Marker generated at | `2026-09-13T00:30:33.631Z` |
| Marker written to `evidence/live-submission.json`, before the submit control was activated | `2026-09-13T00:30:34.765Z` (provider requests at that moment: 0) |
| Submission sent at (submit control activated) | `2026-09-13T00:30:34.768Z` |
| Submissions sent in this run | **1** (submit activations: 1; provider POST requests: 1) |
| Endpoint the browser posted to, verbatim | `https://formsubmit.co/ajax/info@haoo.online` |
| Request method | `POST` |
| Posted body contained the marker | the marker string was found in the request body |
| Provider request failures | none recorded (empty list) |
| HTTP response status | `200` (status text empty) |
| Response `content-type` | `text/html; charset=UTF-8` |
| Response body, verbatim | `{"success":"false","message":"This form needs Activation. We've sent you an email containing an 'Activate Form' link. Just click it and your form will be actived!"}` |
| Confirmation heading rendered | `Your details are on their way` |
| Focused element after the transition | `H3 "Your details are on their way"` |
| Submission status-region text | `Your details were sent.` |
| `<form>` elements after the transition | 0 |
| `role="status"` regions in the document after | 1 |
| Page | `https://www.haoo.online/`, bundle `/assets/haoo-C1OXjuEM.js`, viewport 1280×1024 |
| `navigator.webdriver` | `true` (the flag the shipped `posthog-js` bot filter drops events on) |
| Requests to the analytics ingestion origin `https://us.i.posthog.com` | **0** (empty list) |
| Cloudflare `/cdn-cgi/challenge-platform/` requests (O-2) | 3 (observed; not submissions; not counted as sends) |

What the visitor-visible form carried. The marker was typed into the shipped `Anything else we should
know?` control, and before sending, the control's value read back containing the marker:
`This is an automated release verification sent by the HAOO release process. It is not an enquiry and needs no reply. Marker: HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a`.
Full name `HAOO Release Verification`; email `info@haoo.online` (the mailbox under test, so no address
outside the owner's control entered the submission); channel `Email`; the remaining required selects
took their first non-placeholder option (`Landlord`, `1–5 units`, `Mombasa`, `Ready now`). The controls
present before sending were the shipped eleven (`_honey`, `name`, `email`, `preferredChannel`, `phone`,
`role`, `organization`, `portfolioBand`, `county`, `timeframe`, `message`); none was added or hidden.

Funnel counts: because `navigator.webdriver` read `true` and zero requests reached the ingestion
origin during the run, this submission did not enter the owner's PostHog funnel counts.

### What this evidence does and does not prove

The browser observed the endpoint **accept the request**: one POST, an HTTP 200, and the page's
confirmation state. That is not the same as mail arriving, and it is not activation. The provider's own
response body says the form is **not yet activated** and that an activation link was emailed. Whether
that email reached `info@haoo.online`, which folder it landed in, and what state the endpoint is in
after the link is clicked can only come from the owner's mailbox report. At the end of Task 2, Link 2
therefore stood at **AWAITING OWNER CONFIRMATION**, not CONFIRMED. It was set from the owner's report
in Task 3 (below), not from anything in this subsection.

**Observation L2-O1 — recorded, not acted on in this phase.** The shipped form rendered `Your details
were sent.` and the confirmation card for a response whose body reads `"success":"false"`.
`QualifyForm.tsx` takes its terminal state from the HTTP status alone (`response.ok`) and never reads the
body, by design. Against an unactivated endpoint that design shows a visitor the sent state for a
submission FormSubmit did not deliver. This is a browser-observable fact about the shipped code, measured
here; changing `src/` is outside this plan.

**L2-O1: fixed in source and deployed (2026-09-13).** The owner decided on 2026-09-13 to fix L2-O1
before 05-16. Two commits carry the fix:
- `a7675f4`: the tests, with the response body above, verbatim, as the regression input.
- `e6cf694`, `fix(05): count a qualification send as succeeded only when FormSubmit accepts it (L2-O1)`.

The form now ends in `succeeded` only when the response is OK and the body's `success` reads `'true'` or
`true`. With the body above, the tests end in `We couldn't send your details.` with the form and its
values still mounted. That reading comes from hermetic tests: nothing was sent to take it. The
measurement above is unchanged, and it describes the pre-fix bundle `/assets/haoo-C1OXjuEM.js`.

**Deployed and verified live.** The orchestrator pushed `651eebe..2d45e5f`, whose only source commits are `a7675f4` and `e6cf694`. `Deploy HAOO` run `34729513221` and `Verify tree disjointness` run `34729513230` both concluded `success`. At `2026-09-13T01:06:34Z` the live site served `/assets/haoo-CHYRGEim.js` (207795 bytes, SHA-256 prefix `f1034f2e91285f51`). That name differs from the local build's `haoo-DccNMFAD.js` because the deploy injects build-time variables, as the previous deploy also showed. Static reading: the served bundle contains `const n=e.success;return n==="true"||n===!0` and 0 occurrences of the old `ok?"succeeded":"failed"` pattern. Behavioural reading: at `2026-09-13T01:07:41.317Z` the orchestrator loaded `https://www.haoo.online/` in Chromium, routed `formsubmit.co` to answer locally with HTTP 200 and the pre-activation body above, and submitted the form. It read status `We couldn't send your details.`, 0 confirmation headings, 1 form still mounted, and the entered message retained. 1 POST was intercepted and nothing reached FormSubmit, so the standing count of live submissions below is unchanged. 05-16's tagged submission runs against this bundle.

### Standing count of live submissions in Phase 5

Exactly **two** live submissions are sent in the whole of Phase 5:

1. this activation trigger (`HAOO-ENDPOINT-ACTIVATION-…`, plan 05-06), **sent**, count 1;
2. the tagged release submission (`HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`, plan 05-16),
   **sent** `2026-09-13T01:11:46.454Z`, count 1. Its marker was committed in `49c976a` before the send,
   and it was not retried (Link 3).

**Total live submissions sent in Phase 5: 2.** One message carries each marker above. No other armed
run was made.

**Amendment to the UI design contract.** `05-UI-SPEC.md` §FS-3 speaks of *"the single live success
run"*. That expectation is amended here to **two** live success runs rather than being quietly exceeded.
The reason as the plan stated it, and as it was written here in Task 2, is that FormSubmit does not
deliver the submission that triggers activation and only mails the activation link. **That premise was
contradicted by what followed** (Observation L2-O2 below): the activation-trigger submission *was*
delivered after activation. The count of two stands for a reason that does not depend on the premise.
D-11 orders activation before delivery, so Link 3's delivery claim must rest on a submission sent
through an endpoint already recorded as activated. D-12 and D-13 also require Link 3's own
release-verification marker, fixed before sending, and an inbox-or-spam folder record, which the owner
did not give for this message. A message whose send preceded activation cannot supply either. Each of the
two submissions carries a distinct marker prefix and its own timestamp, so they are distinguishable in
the mailbox and in this record.

### Owner's mailbox report (Task 3)

Asked for: the received date and time as the mailbox shows it, the folder (**inbox or spam**), the
sender address, and the page text after clicking the activation link.

**The owner's words, verbatim**, all received 2026-09-13 and relayed by the orchestrator:

1. Message 1: *"activated form submit and received 3 submissions"*
2. Message 2: a screenshot of the owner's mail client (described below; it contains no words of the
   owner's own).
3. Message 3, when asked whether the other two "New HAOO qualification" messages carry the same marker:
   *"no different, it was I who generated them when testing to see if i can view posthog web and product
   analytics, that bit is still pening"* [owner's correction: *"\*pending"*]

**What the screenshot shows, as read by the orchestrator** (an observation of the screenshot, not the
owner's words, and not seen directly by this executor):

- The message list is shown under "Show: All Messages" with the folder selector reading "Current Folder".
  **The folder name is not visible.**
- `FormSubmit <submission…>` (sender address truncated), subject "Action Required: Activ…" (truncated),
  "Today 03:30".
- `FormSubmit <submission…>`, subject "New HAOO qualificatio…" (truncated), "Today 03:33", three rows.
- The one message open in the preview pane reads `Date: Sun, 13 Sep 2026 00:33:02 +0000 (13/09/2026 03:33:02)`,
  `Someone just submitted your form on https://www.haoo.online/.`, Full name `HAOO Release Verification`,
  Email address `info@haoo.online`, Preferred contact channel `Email`, Role `Landlord`, Portfolio size
  `1-5 units`, Location `Mombasa`, Onboarding timeframe `Ready now`, Message
  `This is an automated release verification sent by the HAOO release process. It is not an enquiry and needs no reply. Marker: HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a`,
  Source `Sent from the HAOO product page on ZERO-PAPER HUB (www.haoo.online)`.
- The mail client displays times in the owner's local zone. The open message's own header gives
  `+0000` alongside `03:33:02` local, so 03:30 and 03:33 local correspond to 00:30 and 00:33 UTC.

**Recorded against each field asked for:**

| Field | Record |
|---|---|
| Activation mail received | Present in the list: `FormSubmit <submission…>`, "Action Required: Activ…", **"Today 03:30"** local (00:30 UTC) as the client displays it; no seconds or full header shown for it |
| Activation link clicked, endpoint state | **Owner-reported:** "activated form submit". Whether the link was clicked more than once is **not stated** |
| Folder, inbox or spam | **Not stated.** The screenshot shows "Current Folder" without a name, and the owner did not say. Not inferred |
| Sender address | **Not stated in full:** truncated to `FormSubmit <submission…` in the screenshot |
| Page text after clicking the activation link | **Not stated** |

These three unstated items were asked for. If the owner supplies them later, they will be added as a
dated amendment below this subsection, not by editing the record above.

**Endpoint state after activation — its own claim.** The endpoint `https://formsubmit.co/ajax/info@haoo.online`
is recorded as **activated, on the owner's report**. Corroboration: FormSubmit delivered a message
carrying this plan's marker, with a header of `00:33:02 +0000`, after the activation mail listed at
03:30 local and after the send at `00:30:34.768Z`. No further request was made to the endpoint by this
plan to test its state. The one-send limit forbids it, and a later delivery is Link 3's claim, not this
link's.

**Observation L2-O2 — the activation-trigger submission was delivered.** The plan's premise was that
FormSubmit does not deliver the submission that triggers activation. The screenshot shows that exact
submission delivered, with the marker, at `00:33:02 +0000`. *Reading, not measured:* FormSubmit appears to
hold the triggering submission and deliver it once the form is activated. This delivered message is
recorded here as an **observation under Link 2**. It does **not** close Link 3, which is plan 05-16's own
tagged release submission (D-12, D-13) and stays NOT STARTED. The unstated folder in particular cannot
stand in for Link 3's inbox-or-spam record.

### Two owner-generated submissions in the same window — not phase sends

Two of the three "New HAOO qualification" messages listed at "Today 03:33" are, in the owner's words,
submissions *"I … generated … when testing to see if i can view posthog web and product analytics"*, and
they do not carry this plan's marker. *Orchestrator's reading, not the owner's words:* these are the owner's
own manual submissions made to check whether PostHog shows web and product analytics, and the third
message is this plan's single automated submission. That reconciles "3 submissions" with this plan's
recorded count of exactly one send.

They are the owner's tests. They are not enquiries, they are not Phase 5 live submissions, and nothing in
this phase sent them. The phase's count of live submissions stays at one sent (this plan) and one to come
(05-16).

**Open owner item (does not block Link 2):** the owner's PostHog web and product analytics check is still
pending, in the owner's words *"that bit is still pening"* [owner's correction: *"\*pending"*].

---

## Link 3 — Delivery

**Status: CONFIRMED.** This rests on the **owner's mailbox report** (2026-09-13, plan 05-16 Task 3): the delivered message carries the marker committed in `49c976a` before the send, and the owner named the folder as **inbox**. Delivery is established by that report. It is **not** established by the browser's success state or by FormSubmit's `"success":"true"`. Those two readings, recorded below, show only that the provider accepted the request. Owned by plan **05-16**.

Status history: **NOT STARTED** until `2026-09-13T01:10:59.543Z` · **MARKER RECORDED, NOT YET SENT** from `2026-09-13T01:10:59.543Z` (committed `49c976a` at `2026-09-13T01:11:29Z`) · **AWAITING OWNER CONFIRMATION** from `2026-09-13T01:11:46.454Z` (send record committed `754ed31`) · **CONFIRMED** on the owner's report received 2026-09-13 (plan 05-16 Task 3).

### The release-verification marker, fixed before sending (D-12)

This marker is written and committed **before** the submission is armed, so the message the owner
searches for is provably the message this plan sent (threat T-05-76). The send record below must
carry this exact string; a run that carries any other marker is not this plan's send.

| Reading | Value |
|---|---|
| Marker | `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` |
| Generated at | `2026-09-13T01:10:59.543Z` |
| How generated | `node:crypto` `randomBytes(4)` hex suffix and the UTC instant to the second, the same expression as `buildMarker` in `e2e/live-submission.e2e.ts`. `buildMarker` could not be called directly: importing the spec module outside the Playwright runner throws `Playwright Test did not expect test.describe() to be called here`. |
| Checked against `MARKER_PATTERN` and the `RELEASE-VERIFICATION` purpose tail | both matched at generation; the armed spec re-checks it with `markerHasPurpose` and refuses to send a mismatch |
| How it reaches the send | `HAOO_LIVE_SUBMISSION_MARKER`, read by the spec before navigation |
| Submissions sent carrying it at the time of writing | 0 |

**MX re-measured before the send (*Restart rule*).** `DiG 9.18.39-0ubuntu0.24.04.7-Ubuntu`, at
`2026-09-13T01:10:38Z`: `dig +short MX haoo.online` (local) returned `10 mx1.privateemail.com.` /
`10 mx2.privateemail.com.`, exit 0; `dig +short MX haoo.online @8.8.8.8` returned
`10 mx1.privateemail.com.` / `10 mx2.privateemail.com.`, exit 0. A further measurement is taken
immediately before the send and gates it. At `2026-09-13T01:10:45Z` `https://www.haoo.online/`
answered HTTP 200 and referenced `/assets/haoo-CHYRGEim.js`, the L2-O1-fixed bundle.

### The single tagged release submission — what the browser observed

**The marker was committed first.** Commit `49c976a` (`2026-09-13T01:11:29Z`) was confirmed to be an
ancestor of `HEAD` in the same command that armed the send.

**MX re-measured immediately before the send, gating it.** At `2026-09-13T01:11:43.608Z`,
`dig +short MX haoo.online` (local) returned `10 mx1.privateemail.com.` / `10 mx2.privateemail.com.`,
exit 0. `dig +short MX haoo.online @8.8.8.8` returned `10 mx2.privateemail.com.` / `10 mx1.privateemail.com.`,
exit 0. The run command executed only because both answers named both hosts.

One armed run, started `2026-09-13T01:11:43.756Z`, ended `01:11:51.679Z`, exit 0:

`HAOO_SEND_LIVE_SUBMISSION=1 HAOO_LIVE_SUBMISSION_PURPOSE=RELEASE-VERIFICATION HAOO_LIVE_SUBMISSION_MARKER=HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d npx playwright test --project=live e2e/live-submission.e2e.ts --retries=0 --workers=1 --reporter=list`

Reporter output: `1 passed (7.1s)`, one result, retry 0. The run was not retried, and no other armed
run was made. The full live suite was not run. The run changed one tracked file,
`evidence/live-submission.json`, adding two records (91 lines) after the two 05-06 records.
Values below are transcribed from those two records and the run's own `LIVE-SUBMISSION` output line.

| Reading | Value |
|---|---|
| Marker, as sent | `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`, identical to the marker committed in `49c976a` |
| Marker generated at | `2026-09-13T01:10:59.543Z` (see above) |
| Marker read by the spec from `HAOO_LIVE_SUBMISSION_MARKER` (the spec's `markerGeneratedAt` field) | `2026-09-13T01:11:45.639Z`; `markerSource`: `supplied through HAOO_LIVE_SUBMISSION_MARKER, recorded before the run` |
| Marker written to `evidence/live-submission.json`, before the submit control was activated | `2026-09-13T01:11:46.451Z` (provider requests at that moment: 0) |
| Submission sent at (submit control activated) | `2026-09-13T01:11:46.454Z` |
| Messages sent carrying this marker | **1** (submit activations: 1; provider POST requests: 1) |
| Endpoint the browser posted to, verbatim | `https://formsubmit.co/ajax/info@haoo.online` |
| Request method | `POST` |
| Posted body contained the marker | `bodyCarriesMarker: true`, meaning the marker string was found in the request body |
| Provider request failures | none recorded (empty list) |
| HTTP response status | `200` (status text empty) |
| Response `content-type` | `text/html; charset=UTF-8` |
| Response body, verbatim | `{"success":"true","message":"The form was submitted successfully."}` |
| Confirmation heading rendered | `Your details are on their way` |
| Focused element after the transition | `H3 "Your details are on their way"` |
| Submission status-region text | `Your details were sent.` |
| `<form>` elements after the transition | 0 |
| `role="status"` regions in the document after | 1 |
| Page | `https://www.haoo.online/`, bundle `/assets/haoo-CHYRGEim.js`, viewport 1280×1024 |
| `navigator.webdriver` | `true` |
| Requests to the analytics ingestion origin `https://us.i.posthog.com` | **0** (empty list) |
| Cloudflare `/cdn-cgi/challenge-platform/` requests (CF-JSD-1) | 3 (observed; not submissions; not counted as sends) |

**Compared with the pinned success contract** (`05-EVIDENCE-FORM-STATES.md` §1, `success` row, taken on
preview):

| Contract element | Pinned value | This send |
|---|---|---|
| Form subtree replaced | `0` form elements remain | `0` |
| Heading | `Your details are on their way` | `Your details are on their way` |
| Focus destination | `H3 tabindex=-1` "Your details are on their way" | `H3 "Your details are on their way"` (the `tabindex` attribute was not read by this spec) |
| Status-region text | `Your details were sent.` | `Your details were sent.` (read from the submission region, FS-O1) |
| Body copy | `Your details were submitted. If you don't hear back within one business day, use one of the contacts below.` | **not read by this spec** |
| Follow-up prompt and its 2 links | `Need an answer sooner?`, the `wa.me` and `tel:` links | **not read by this spec** |

The four elements the spec reads match the pinned values. The body copy, the follow-up prompt and its
two links were not read by `e2e/live-submission.e2e.ts`, which captures neither. They are recorded as
not measured, not as matching. They were not measured afterwards either, because doing so would have
needed a second live submission. This is the first live reading of this success state on the fixed
bundle. The 05-06 send ended in the same four readings, but on the pre-fix bundle, where the page did not
read the provider's body.

**What the visitor-visible form carried.** The marker was typed into the shipped `Anything else we
should know?` control. The spec asserted that the control was visible and that its value read back
exactly, and `markerReadBackFromVisibleControl` was recorded `true` before any provider request. The value:
`This is an automated release verification sent by the HAOO release process. It is not an enquiry and needs no reply. Marker: HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`.
Full name `HAOO Release Verification`; email `info@haoo.online`; channel `Email`; the remaining required
selects took `Landlord`, `1–5 units`, `Mombasa`, `Ready now`. The controls present before sending were
the shipped eleven (`_honey`, `name`, `email`, `preferredChannel`, `phone`, `role`, `organization`,
`portfolioBand`, `county`, `timeframe`, `message`). None was added and none was hidden for the marker.

**Analytics consequence, measured rather than anticipated.** The event this form emits on a send is
`qualify_submit`. `05-EVIDENCE-HARNESS.md` §4 expected this D-12 submission to be human-driven, with
`navigator.webdriver` `false`, and so to be *"the one known inclusion"* in the owner's funnel counts. That
premise does not hold for this send. It was driven by Playwright through the guarded spec, which 05-06
built for reuse. `navigator.webdriver` read `true`, and 0 requests reached `https://us.i.posthog.com`
across the run. So the `qualify_submit` event for this submission was **not** captured, and the owner's
report **does not carry it**. The inclusion that section names did not occur, and no tagged submission
adds to the owner's funnel counts.

**What this evidence does and does not prove.** The browser observed the endpoint accept the request:
one POST, HTTP 200, a body whose `success` reads `"true"`, and the page's success state, which on this
bundle requires that body. That is FormSubmit's statement that it accepted the submission. It is not
evidence that the message arrived at `info@haoo.online`, or which folder it landed in. Link 3 therefore
stands at **AWAITING OWNER CONFIRMATION**, and it moves only on the owner's verbatim mailbox report (D-13).

### Owner's mailbox report (Task 2 checkpoint, transcribed in Task 3)

What I asked for: the exact marker string found by searching the mailbox, the received date and time as
the mailbox displays it, the folder (**inbox or spam**, named explicitly), the full sender address, and
the subject line.

**The owner's words, verbatim.** Both were received 2026-09-13 and relayed by the orchestrator:

1. Message 1: a screenshot of the owner's mail client, captioned *"the last form sumission you made"*
   (the owner's spelling, kept as written).
2. Message 2: the orchestrator asked *"Which folder is the 04:11 message (marker …b770730d) in?"*,
   offering `Inbox` and `Spam / Junk`. The owner selected **"Inbox"**.

**What the screenshot shows, as read by the orchestrator.** This is the orchestrator's reading of the
owner's screenshot, not the owner's words, and this executor did not see the screenshot:

- A new top row in the message list: sender `FormSubmit <submission…` (cut off), subject
  `New HAOO qualificatio…` (cut off), received **"Today 04:11"**.
- The open message's Message row ends `Marker: HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`.
  That is **character for character** the marker committed in `49c976a` before the send.
- No `Date:` header with seconds was visible.
- The older rows visible beneath are the 05-06-era messages already recorded under Link 2. They are not
  recorded again here.

**Recorded against each field asked for.** Only these fields are recorded. No message content beyond
the marker appears in this file, because both repositories are public.

| Field | Record |
|---|---|
| Marker found | `HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d`, read from the open message in the owner's screenshot (orchestrator's reading). It is identical to the marker committed in `49c976a` and to the marker the browser posted at `01:11:46.454Z`. |
| Received timestamp | **"Today 04:11"**, as the owner's mail client displays it. The client shows local time. Under Link 2 its offset was measured from a `+0000` header shown beside `03:33:02` local, which makes 04:11 local equal to **01:11 UTC** on 2026-09-13. That agrees with the send at `2026-09-13T01:11:46.454Z`. No seconds were shown, and none are recorded. |
| Folder | **inbox**. This is the owner's direct answer to the folder question. |
| Sender address | **Not stated in full.** It is cut off in the owner's screenshot at `FormSubmit <submission…`. The owner was asked for it and did not supply the rest. It is not completed from memory or from Link 2. |
| Subject line | **Not stated in full.** It is cut off in the owner's screenshot at `New HAOO qualificatio…`. The owner was asked for it and did not supply the rest. It is not completed from memory or from Link 2. |

The two fields that are not stated do not hold Link 3 open. D-13's record is the marker, the received
timestamp and the folder, and all three are established above.

**Folder note (D-13).** The message landed in the **inbox**. The spam-landing branch of D-13 does not
apply, so no sender-authentication follow-up is raised by this link. This record says only where this
one message landed. It measures nothing about the domain's sender authentication.

### The LEAD-07 mail chain — closed

| Link | Final status | Timestamp | Authorised by |
|---|---|---|---|
| 1 — MX | CONFIRMED | `2026-09-12T21:03:51Z`; re-measured `2026-09-13T01:11:43.608Z` before this send | measurement from two resolvers |
| 2 — Activation | CONFIRMED | owner's report 2026-09-13; corroborating header `00:33:02 +0000` | the owner's report |
| 3 — Delivery | CONFIRMED | sent `2026-09-13T01:11:46.454Z`; received "Today 04:11" local (01:11 UTC); folder inbox | the owner's report |

LEAD-07 asks that the endpoint is **activated** and that a uniquely tagged production submission
**reaches the inbox or spam folder**. Link 2 records the first claim and Link 3 the second, each on the
owner's report, and in the order D-11 requires. Total live submissions sent in Phase 5: **2**, one message
per marker: `HAOO-ENDPOINT-ACTIVATION-20260913T003033Z-571c962a` (05-06) and
`HAOO-RELEASE-VERIFICATION-20260913T011059Z-b770730d` (05-16). Nothing further was sent after the owner's
report.

**History note: the pre-send placeholder for this link, written before Link 2 was confirmed and kept
as written. It no longer describes Link 3's state, which is CONFIRMED above.** It read: *Was blocked
on link 2. A tagged submission sent through an unactivated endpoint proves nothing about delivery,
which is the ordering trap 05-RESEARCH.md §"Pitfall 9" names.* The paragraph below belongs to the same
placeholder.

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
