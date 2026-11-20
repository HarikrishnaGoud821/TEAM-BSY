<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- `contributions` is the single source of truth for collected money; dashboard, reports and receipts read from it. Why: avoids competing payment records.
- Online contributions are only marked SUCCESS server-side (Razorpay signature verify in `src/lib/payments.functions.ts` or the signed webhook at `/api/public/razorpay-webhook`). Why: never trust the browser.
- Cash inserts are allowed only via RLS for admin/mentor with OFFLINE+CASH; members cannot record cash. Why: enforced in the database, not just UI.
- Receipt numbers are assigned by a DB trigger from `receipt_counters` (BSY-YYYY-NNNNNN) when status becomes SUCCESS. Why: unique, gap-safe under concurrency.
- Roles live in `user_roles` checked via `has_role`/`has_any_role`; first signup becomes admin. Why: prevents privilege escalation.
- Expense receipt files go to the private `expense-receipts` bucket under `<uid>/...`; tables store only the file key/metadata. Why: no binaries in the database.
- No GPS/latitude/longitude or map APIs; location is village/mandal/district/pincode text. Why: explicit product rule.
- Group chat data stays in dedicated public tables protected by member-scoped RLS, with attachments in a private bucket and group-scoped paths. Why: conversation access must not depend on client-side checks.
