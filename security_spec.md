# Security Specification: EduShare Thai

## 1. Data Invariants
1. **User Identity & Roles**: A user cannot promote themselves to 'admin' or 'moderator'. User roles can only be set or changed by verified administrators or during initial bootstrap if matching authorized owner email `kittawat5532@gmail.com`.
2. **Resource Ownership**: Only the author (with verified email/active status) or an Admin/Moderator can edit or delete a resource.
3. **Immutability of Author & Creation Time**: The `authorId` and `createdAt` of a resource cannot be mutated upon update.
4. **Active Account Requirement**: Suspended users cannot post new resources, write comments, or create favorites.
5. **Favorites Integrity**: A user can only create or delete favorites where `userId == request.auth.uid`.
6. **Reports Handling**: Any authenticated user can create a report on an existing resource. Only moderators and admins can update the status of reports (e.g., mark resolved or dismissed).
7. **Site Settings**: Only admins can modify website settings (`/settings/general` and `/settings/categories`).
8. **Catch-All Default Deny**: All unmatched collections and documents are denied by default.

## 2. The "Dirty Dozen" Threat Payloads
1. **Privilege Escalation**: Non-admin user attempts to create/update `/users/{uid}` with `role: 'admin'`. (Expected: PERMISSION_DENIED)
2. **Unauthorized Resource Modification**: User A tries to edit Resource owned by User B. (Expected: PERMISSION_DENIED)
3. **Spoofed Author ID**: User A tries to create a Resource with `authorId: 'user_B'`. (Expected: PERMISSION_DENIED)
4. **Deleted Resource by Stranger**: Normal user attempts to delete a Resource created by another user. (Expected: PERMISSION_DENIED)
5. **Favorite Hijacking**: User A attempts to write a favorite entry for User B (`userId: 'user_B'`). (Expected: PERMISSION_DENIED)
6. **Report Tampering**: Regular member attempts to set a Report's status to `resolved`. (Expected: PERMISSION_DENIED)
7. **Settings Vandalism**: Regular member attempts to overwrite `/settings/general` with malicious content. (Expected: PERMISSION_DENIED)
8. **Admin Collection Injection**: Regular member tries to insert their own UID into `/admins/{uid}`. (Expected: PERMISSION_DENIED)
9. **Oversized Payload / Wallet Exhaustion**: Injecting a 2MB string into resource title. (Expected: PERMISSION_DENIED)
10. **Unauthenticated Resource Write**: Anonymous/unauthenticated request attempts to create a resource. (Expected: PERMISSION_DENIED)
11. **Audit Log Tampering**: Regular member attempts to delete or alter `/moderationLogs`. (Expected: PERMISSION_DENIED)
12. **Status Bypass While Suspended**: A suspended user attempts to post a resource. (Expected: PERMISSION_DENIED)
