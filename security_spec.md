# PakBerlin Connect Security Specification

## Data Invariants
1. A user profile must have a valid `uid` matching their auth ID.
2. A friend request must have a `fromUid` and `toUid`.
3. A chat message must belong to a valid `matchId` where the sender is a participant.
4. Users can only see profiles in their city (Berlin) or nearby.

## The Dirty Dozen Payloads
1. Create a profile with someone else's `uid`.
2. Update a profile's `uid` field.
3. Send a friend request from another user's UID.
4. Accept a friend request intended for someone else.
5. Create a chat message in a match you are not part of.
6. Delete another user's profile.
7. Read private PII (email) of another user.
8. Update `isAdmin` field on own profile (Self-Privilege Escalation).
9. Create a profile with a 1MB bio string (Resource Exhaustion).
10. Spoof `createdAt` with a past timestamp.
11. Inject malicious document IDs with special characters.
12. List all users without any query filters (Scraping).

## Test Runner
(Will be implemented in firestore.rules.test.ts)
