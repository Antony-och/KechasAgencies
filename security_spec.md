# Kechas Agencies Firestore Security Specification

## 1. Data Invariants
1. **Default-Deny Catch-All**: All undefined paths under `/databases/{database}/documents` are strictly denied.
2. **Role Separation (Admin vs. Dispatcher)**:
   - Bootstrap admin (`antonyonyi75@gmail.com` with `email_verified == true`) and active `/staff/{uid}` documents with `role == 'admin'` hold full administrative control (`settings`, `staff`, `staff_invites`, destructive deletes).
   - Active `/staff/{uid}` documents with `role == 'dispatcher'` can manage daily operations (`bookings`, `vehicles` status/handover, `drivers`, `maintenance_logs`, `transactions`, `clients`, `journal`, `destinations`, `testimonials`) but cannot alter `staff`, `staff_invites`, or `settings`.
3. **Zero Privilege Escalation**: A newly signing-in user can only create their own `/staff/{uid}` profile if they are the verified bootstrap admin OR have an active `/staff_invites/{email}` record matching their verified lowercase email, and `role` must equal the invited role (or `admin` for bootstrap). Non-admin users can never mutate their own `role` or `status`.
4. **PII Isolation**:
   - `bookings`, `inquiries`, `drivers`, `clients`, `transactions`, `maintenance_logs`, `staff`, and `staff_invites` contain phone numbers, National IDs, KRA PINs, emails, or M-Pesa codes. Public/anonymous reads (`get` and `list`) on these collections are strictly denied.
   - Public booking submission (`/book`) may only `create` a `bookings` document with `status == 'Pending'`, `source == 'Online'`, `amountPaidKes == 0`, `paymentStatus == 'Unpaid'`, valid schema keys, and server-verified `request.time` timestamps.
   - Public inquiry submission (`/contact`) may only `create` an `inquiries` document with `status == 'New'`, no `bookingRef`/`handledBy` staff fields, at least one phone or email channel, valid schema keys, and server-verified `request.time` timestamps.
5. **Public Catalogs**: `vehicles`, `journal`, `destinations`, `testimonials`, and `settings/site` are publicly readable (`get` / `list`) so the public storefront reflects live CMS and fleet updates, while writes are restricted to authorized staff/admin.

## 2. Dirty Dozen Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Privilege Escalation on `/staff/{uid}`**: Non-invited user creates `/staff/{uid}` with `role: "admin"`.
2. **Self-Role Promotion**: Existing `dispatcher` updates `/staff/{uid}` changing `role` from `"dispatcher"` to `"admin"`.
3. **Unverified Email Admin Spoof**: Token has `email: "antonyonyi75@gmail.com"` but `email_verified: false` attempting to read `/bookings`.
4. **Public PII Scrape on `/bookings` & `/inquiries`**: Unauthenticated user executes `list` on `/bookings` or `/inquiries`.
5. **Public PII Scrape on `/drivers`**: Unauthenticated user executes `get` on `/drivers/driver-1` (National ID / DL leak).
6. **Public Booking/Inquiry State Forgery**: Public user submits `create` on `/bookings/{id}` with `status: "Confirmed"` or on `/inquiries/{id}` with `status: "Converted"`.
7. **Shadow Field Injection on `/bookings` & `/inquiries`**: Public user submits `create` on `/bookings/{id}` or `/inquiries/{id}` with extra ghost field `isApproved: true`.
8. **Client Timestamp Forgery**: Public or staff write sends `createdAt` different from `request.time`.
9. **ID Poisoning**: Write to `/vehicles/<200-char-junk-id>` or `/vehicles/bad$id`.
10. **Settings Tampering by Dispatcher**: Authenticated `dispatcher` attempts `update` on `/settings/site`.
11. **Oversized String DoS**: Public booking `notes` exceeding `maxLength: 500` or public inquiry `message` exceeding `maxLength: 1000`.
12. **Terminal State Bypass by Non-Staff**: Unauthenticated user attempts `update` on `/bookings/{id}` or `/inquiries/{id}` to modify status.
