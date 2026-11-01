# FIKova Business Portal — Development Branch

Business management follows the Assurance Regent **Developer Companies directory** patterns while preserving FIKova's existing Client, Rider and Management code. This is a separately authenticated, database-backed portal, not the earlier browser-local demo.

## Status on 1 November 2026

**Feature implementation is in a GitHub feature branch, not merged into main.**
The current portal is deliberately **unconfigured** until a dedicated FIKova Supabase project is provisioned. Do not put the existing FINDAT or Assurance Regent Supabase URL in \`fikova-config.js\` because those existing projects use other apps' authentication and triggers.

The FINDAT Supabase project was used temporarily to validate the SQL schema. Seven prefixed tables, storage bucket and protected invitation Edge Function were applied there, with no FIKova business users created. These are **not** the intended live backend.

The Supabase project quoted a new project at **$0/month** in the connected organization, but provisioning requires explicit user cost confirmation even at $0. Once confirmed, create **FIKova Business Platform** in the FINDAT-Consultants organization.

## Completed source

- \`index.html\`: unchanged core workflows; loads the Business navigation entry.
- \`fikova-entry.js\`: Business registration shortcut, Business login option, Management console link and footer link.
- \`business-portal.html\`: responsive Assurance Regent-style company management interface and business storefront.
- \`fikova-business.js\`: Supabase Auth registration/signin, owner products and photo uploads, public catalogue, company list, billing editor, activation switch, notices, audit and manager-created company invitations.
- \`fikova-config.js\`: **blank on purpose** until the isolated backend is confirmed.
- \`supabase/FIKOVA_BUSINESS_PORTAL.sql\`: seven RLS-protected tables plus product-photo storage and protected Management rights.
- \`supabase/FIKOVA_BUSINESS_STATUS_NOTICES.sql\`: transactional welcome, activation and suspension notices.
- \`supabase/functions/fikova-company-invite/index.ts\`: management-only invite-by-email and pending company creation.

## Setup on the dedicated project

1. Create a new Supabase project for FIKova (not the FINDAT website project and not Assurance Regent).
2. Execute the two SQL scripts in order on the new project, including the RLS and Storage policies.
3. Deploy \`fikova-company-invite\` as a JWT-protected Edge Function.
4. Fill **only** the Supabase project URL and browser **publishable** key into \`fikova-config.js\`. Never commit or expose a service-role key. The invite function uses secret server-only credentials provided by the Supabase runtime.
5. In Supabase Auth URL configuration, permit the hosted FIKova Business portal's URL as an email redirect URL, and configure working signup/invite email delivery.
6. Create the first FIKova Management Supabase account by registering/signing in with a verified email (never reuse the existing FIKA hard-coded demo password).
7. As the trusted SQL administrator, appoint the exact account UUID with:
   
   \`\`\`sql
   insert into public.fikova_management_users (user_id)
   values ('REPLACE_WITH_VERIFIED_MANAGER_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   \`\`\`
   
   **Never** allow an unverified new user to make themselves a manager. This is the only manual initial bootstrap.
8. Configure official FIKova WhatsApp/email and verified payment instructions from Management > Contact settings.
9. Test signup, verification, company creation, product/photo upload and permissions across two real browsers/devices before merging the pull request into \`main\`.

## Account lifecycle

- **Pending**: Business is registered in Postgres; owner can add photos/products but product visibility is blocked by RLS until activation.
- **Active**: Management has confirmed the company and manual payment; published products are visible publicly.
- **Suspended**: Management turned the switch off; products disappear from public catalogue and owner receives a database-generated payment/support notice.
- **Reactivated**: Management turns the switch back on; the database records an audit event and sends the owner an activation notice.

Management can edit business identity, location, currency, subscriptions, payment instructions, moderate products, invite owners by email, change status, send notices and view audit records. Management rights are stored in a protected database table, not in editable browser metadata.

## Production cautions

- The earlier FIKA Client/Rider/Management system remains browser-local. The new Business portal is database-backed but does **not** automatically migrate all existing FIKA accounts and orders.
- The original FIKA demo Management credentials are visible in the public source; they **cannot** authorize the new database and must not be treated as production credentials.
- Public product photos are intentionally public marketing assets; do not upload personal identity documents or private banking information there.
- A business's contact email/phone are directory/contact information. Use business contact details, not confidential owner identifiers.
- Management invoice/payment confirmation is manual; this module has **no automated payment gateway**.
- Company invites depend on Supabase Auth's email provider/settings; invitations must be tested after deployment.
- Tested to date: SQL migration application and table/RLS inspection, JavaScript syntax, GitHub file/branch integration. Full end-to-end signup, actual invited email, web UI rendering and two-device tests are still outstanding.

## Assurance Regent reference

Source patterns from \`FINDAT-Consultants/ADRA.io\` were examined: Developer-owned company directory; company code, name, country/currency and logo; editable business billing grid; create-company form; Management-only actions and approval controls. No Assurance Regent code/database has been modified.
