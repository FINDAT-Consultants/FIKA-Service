# FIKova Business registration and marketplace (browser-local preview)

This feature adds a Business role, product-photo listings, a customer marketplace, account messages and Management approval controls.

## How to try it

1. Open the application and choose **Sign up** > **Business**.
2. Enter owner name, business name, business category, location, email, phone and password.
3. Sign in as **Business** to access **My Business**, upload product photographs (up to 3 photos per product), set a price and save the listing.
4. Initially the business is **Pending approval** and its products are hidden from the marketplace.
5. Sign in as **Management** on the **same browser**, choose **Businesses & Approvals** (also shown at the top of **Database**).
6. Set official FIKova WhatsApp/email contact information, verify the business and its payment *outside the application*, and use the activation toggle.
7. Activate to publish products. Deactivate to hide its products and send a payment reminder automatically. The **Send payment notice** action writes an additional message to the owner's in-app inbox.
8. Sign in as a Client, Rider, or Management account and choose **Marketplace** to browse active businesses' products and contact a seller.

## Status rules

- **Pending:** Account exists; business owner can create draft product listings, but listings are not shown to buyers.
- **Active:** Listings become visible in Marketplace on the browser storing the records.
- **Suspended:** Listings are hidden; account owner can still see the notice, contact details, and manage saved drafts.
- **Reactivation:** Management verifies payment manually, reactivates the switch, and a confirmation message is added.

## No online payment gateway

This implementation does **not** collect money or automatically confirm payment. Business owners are directed to contact FIKova directly for verified bank or mobile-money instructions. Management may enter a payment reference or instructions in the individual payment notice. No official contact number or bank details have been invented or hardcoded.

## Important limitations before public launch

This is a **local demonstration, not a production backend**. FIKA's existing users, products, payment messages, and approval status are stored separately in each browser's localStorage. **Business owners and Management on different devices will not share those records.** Opening the site in another browser/device will not show the same registrations or catalogue. Product pictures are compressed and limited to avoid localStorage quota errors.

The existing application also has client-side role checks and publicly embedded default demo credentials. Browser storage and client-only switches cannot securely enforce activation or protect private business data.

Before accepting real registrations or subscription payments:
- Add a centrally hosted authentication service and role-based server-side authorization.
- Move business accounts, products, messages, approval state, and audit history to a shared database.
- Use private object storage for images, with upload limits and access policies.
- Enforce published-product visibility and activation status on the server, not in JavaScript.
- Replace public default Management credentials and plaintext password handling.
- Restrict Management approval and payment messages with server-side permissions.
- Configure verified business contact channels and test approval across devices.

## Files

- `index.html`: loads the new business module.
- `business.js`: browser-local business UI, registration handler, product storage, marketplace and administration controls.
