# Security Specification for Notifications

## 1. Data Invariants
- A notification cannot exist without a valid userId that belongs to the user.
- Notifications are owned by the user (userId).
- Only the owner can read, update (mark as read), or delete their notifications.
- System processes might create notifications (admin access).

## 2. The "Dirty Dozen" Payloads

1.  **Inject Wrong User ID (Spoofing)**: `{userId: "otherUser", title: "Test", ...}` - Should fail (auth.uid != userId).
2.  **Missing Field (Title)**: `{userId: "uid", message: "Test", ...}` - Should fail (schema validation).
3.  **Invalid Type (isRead)**: `{..., isRead: "yes"}` - Should fail (schema validation).
4.  **Ghost Field**: `{..., ghostField: "value"}` - Should fail (affectedKeys().hasOnly() validation).
5.  **Inject Admin Field (isAdmin)**: `{..., isAdmin: true}` - Should fail (security check).
6.  **Update Immutable Field (createdAt)**: `{..., createdAt: "newDate"}` - Should fail (immutability check).
7.  **Poison ID**: `/{database}/documents/notifications/A!@#$!@#$` - Should fail (isValidId).
8.  **Empty Field (Title)**: `{..., title: ""}` - Should fail (size validation).
9.  **Huge Field (Message)**: `{..., message: "A...10001 characters"}` - Should fail (size validation).
10. **Delete by non-owner**: Delete operation by non-owner. - Should fail.
11. **Read by non-owner**: Read operation by non-owner. - Should fail.
12. **Update isRead by non-owner**: Update operation by non-owner. - Should fail.

## 3. The Test Runner

See `firestore.rules.test.ts` for implementation.
