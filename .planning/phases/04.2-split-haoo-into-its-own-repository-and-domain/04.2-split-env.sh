# 04.2-split-env.sh — the four values every plan in phase 04.2 depends on.
#
# WHY THIS FILE EXISTS
# Plans 04.2-02 through 04.2-09 each run in a FRESH shell. A value recorded only as
# prose in 04.2-SPLIT-CONTRACT.md is not available to any of them, so the four
# settled choices are exported here instead of retyped per plan. Retyping is how two
# plans end up disagreeing about one hostname.
#
# WHY EVERY CONSUMER GUARDS ON IT
# `cd "$VAR"` with VAR unset or empty is a NO-OP THAT RETURNS SUCCESS: the shell stays
# where it is and reports zero. A verification meant for the HAOO repository would then
# silently run in ZERO-PAPER HUB and report green. Every `<verify>` command in plans
# 04.2-02 through 04.2-09 therefore opens with:
#
#   : "${HAOO_CHECKOUT:?}" "${ZPH_CHECKOUT:?}" "${HAOO_HOST:?}" "${HAOO_REPO:?}"
#
# which aborts on an unset or empty value rather than proceeding into the wrong tree.
#
# USAGE
#   . .planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-split-env.sh
#
# CONTRACT FOR THIS FILE
# Exactly four exports, nothing else. No logic, no `cd`, no side effects, no command
# substitution. Safe to source repeatedly. Both paths are absolute — a relative path
# would resolve against whatever directory the consuming plan happens to be in.
#
# Values are settled in 04.2-SPLIT-CONTRACT.md; change them there and here together.

# This checkout — the existing ZERO-PAPERHUB repository (D-02: it keeps its identity).
export ZPH_CHECKOUT="/home/paul/Documents/Vibe Coding Projects/ZERO-PAPERHUB"

# The sibling directory where plan 04.2-02 clones the HAOO repository.
# EXACTLY ONE HAOO checkout exists for the whole phase, at this path, and no two plans
# in the same wave operate in it.
export HAOO_CHECKOUT="/home/paul/Documents/Vibe Coding Projects/HAOO"

# Task 2 answer (c): a fresh repository. `KaruguDev/Lipa-Nyumba` is explicitly not reused.
export HAOO_REPO="KaruguDev/HAOO"

# Task 2 answer (a): the apex leg. GitHub Pages supplies the `www` counterpart redirect.
export HAOO_HOST="haoo.online"
