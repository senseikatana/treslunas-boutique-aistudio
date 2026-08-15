# Security Specification

## Data Invariants
1. A user profile document (`/users/{userId}`) can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. An order (`/orders/{orderId}`) belongs to the user whose `request.auth.uid == userId`. Only that user can create and view their orders.
3. A drive backup record (`/drive_backups/{backupId}`) belongs to the user whose `request.auth.uid == userId`. Only that user can create, view, or delete their drive backup links.

## Dirty Dozen Payloads Handled
1. Spoofed `userId` on User creation (User A writes document with User B's UID) -> Blocked by `request.auth.uid == userId`.
2. Spoofed `userId` on Order creation -> Blocked by `incoming().userId == request.auth.uid`.
3. Malicious ID with junk characters -> Blocked by `isValidId()`.
4. Over-sized string attributes (exceeding length bounds) -> Blocked by length checks.
5. Insecure listing of all users -> Blocked by `allow list: if false`.
6. Reading another user's order -> Blocked by `resource.data.userId == request.auth.uid`.
7. Mutating immutable order `userId` -> Blocked by `incoming().userId == existing().userId`.
8. Updating another user's drive backup -> Blocked by `resource.data.userId == request.auth.uid`.
9. Deleting another user's drive backup -> Blocked by `resource.data.userId == request.auth.uid`.
10. Unauthenticated access to private orders or backups -> Blocked by `isSignedIn()`.
11. Unlisted fields injection -> Blocked by exact key validation in `isValid*` helpers.
12. Blanket catch-all access -> Blocked by default deny rule.
