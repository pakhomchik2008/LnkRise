# Asset Transfer Agreement — LnkRise

A one-page template. Fill in the brackets, both sides sign, done — this is not
a substitute for a lawyer on a large deal, but it is enough paper to remove
"who actually owns this after I pay" as an objection on a small one.

---

**Seller:** [Full legal name] ("Seller")
**Buyer:** [Full legal name] ("Buyer")
**Effective date:** [Date, only once §3 has happened]

## 1. What's being sold

The "Assets": the complete source code, git history, documentation, and
associated content of the project known as **LnkRise**, as delivered to Buyer
on or before the Effective Date, including:

- All source code in the delivered repository and its full git history
- Written documentation (`README.md`, `docs/`) delivered with it
- Placeholder/sample content (seeded case studies, blog posts) marked as such
- The right to use the name "LnkRise" and any logos/marks created for it

Explicitly **not included** (Seller retains or has no rights to transfer):

- Any third-party account, API key, or credential — Stripe, Anthropic,
  Resend, Google/LinkedIn OAuth apps, hosting, or domains. Buyer provisions
  their own.
- Any domain name not already owned by Buyer.
- Seller's other projects, even where code is shared or similar.

## 2. Price and payment

Total price: **$[amount] [currency]**, paid as: [one lump sum / schedule].
Payment method: [wire / Stripe / other]. Payment is due before any transfer
step in §3 begins.

## 3. Transfer mechanics

On receipt of full payment, Seller will, within [X] business days:

1. Transfer the git repository to a location Buyer controls (GitHub transfer,
   or push to a repo Buyer names).
2. Revoke Seller's own access to any environment, database, or account tied
   to the Assets that Buyer does not also need Seller to retain.
3. Hand over any credentials Buyer explicitly asked to inherit (rare — most
   should be rotated, not transferred; see §1).

## 4. Assignment of rights

Effective on full payment, Seller irrevocably assigns to Buyer all right,
title, and interest in the Assets, including all copyright and other
intellectual property rights, worldwide, in perpetuity. Seller waives any
moral rights to the extent permitted by law. Buyer may use, modify,
sublicense, rebrand, and resell the Assets without further consent from or
payment to Seller.

## 5. No warranty

The Assets are sold **as is**. Seller makes no warranty that the software is
free of defects, that any particular feature works as documented, or that it
is fit for a particular purpose. Buyer has had the opportunity to review the
code and any due-diligence materials (including `docs/BUYER-README.md`)
before paying. Known limitations at the time of sale are listed there and are
not grounds for a refund.

## 6. No ongoing obligation

Unless separately agreed in writing, Seller has no obligation to provide
support, bug fixes, or further development after the Effective Date.

## 7. Confidentiality

Buyer may keep the terms of this sale (price, payment method) confidential or
public at their discretion. Seller will not disclose Buyer's identity in
connection with this transaction without Buyer's consent.

## 8. Governing law

This agreement is governed by the laws of [jurisdiction], without regard to
conflict-of-law principles.

---

**Seller signature:** _______________________ **Date:** ___________

**Buyer signature:** _______________________ **Date:** ___________
