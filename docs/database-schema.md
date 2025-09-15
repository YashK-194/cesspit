# Cesspit Firestore Database Schema

## Overview

This document outlines the optimized Firestore database schema for the Cesspit platform, designed for scalability, performance, and efficient querying.

## Core Collections

### 1. `users` Collection

**Document ID**: Firebase Auth UID
**Purpose**: Store user profile and metadata

```javascript
{
  // Core Profile Data
  uid: "string",                    // Firebase Auth UID (matches document ID)
  email: "string",                  // User's email from Firebase Auth
  name: "string",                   // User's display name
  username: "string",               // Lowercase username for queries
  displayUsername: "string",        // Original case username for display
  bio: "string",                    // User bio (max 160 chars)
  photoURL: "string",               // Profile picture URL

  // Timestamps
  createdAt: "timestamp",           // Account creation date
  updatedAt: "timestamp",           // Last profile update

  // Counters (for display, not for business logic)
  followersCount: "number",         // Number of followers
  followingCount: "number",         // Number of users following
  rantsCount: "number",             // Number of rants posted

  // Status flags
  isVerified: "boolean",            // Verification status
  profileCompleted: "boolean",      // Profile setup completion flag

  // Privacy settings (future)
  isPrivate: "boolean",             // Private account flag
  showEmail: "boolean"              // Email visibility setting
}
```

**Indexes**:

- `username` (ascending) - for username searches
- `createdAt` (descending) - for newest users
- `rantsCount` (descending) - for most active users

### 2. `usernames` Collection

**Document ID**: Lowercase username
**Purpose**: Fast username lookup and uniqueness enforcement

```javascript
{
  uid: "string",                    // Reference to user document
  username: "string",               // Lowercase username (matches document ID)
  displayUsername: "string",        // Original case for display
  createdAt: "timestamp"            // When username was claimed
}
```

**Benefits**:

- O(1) username availability checking
- Prevents username conflicts
- Enables efficient username-based lookups
- Supports future username change history

### 3. `rants` Collection

**Document ID**: Auto-generated
**Purpose**: Store user rants/posts

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  authorId: "string",               // User UID who posted
  authorUsername: "string",         // Author's username (denormalized for efficiency)
  authorName: "string",             // Author's display name (denormalized)
  authorPhotoURL: "string",         // Author's profile picture (denormalized)

  // Content
  content: "string",                // Rant text content (max 280 chars)
  contentType: "string",            // "text", "image", "video" (future)

  // Timestamps
  createdAt: "timestamp",           // Post creation time
  updatedAt: "timestamp",           // Last edit time

  // Engagement metrics (denormalized for performance)
  upvotes: "number",                // Upvote count
  downvotes: "number",              // Downvote count
  netScore: "number",               // upvotes - downvotes (for sorting)
  commentsCount: "number",          // Number of comments
  sharesCount: "number",            // Share count
  viewsCount: "number",             // View count

  // Content metadata
  tags: ["string"],                 // Topic tags (max 5)
  mentions: ["string"],             // Mentioned usernames
  hashtags: ["string"],             // Extracted hashtags

  // Status flags
  isEdited: "boolean",              // Edit flag
  isDeleted: "boolean",             // Soft delete flag
  isPinned: "boolean",              // Pinned by author

  // Moderation
  isReported: "boolean",            // Report flag
  isFlagged: "boolean",             // Moderation flag
  reportCount: "number",            // Number of reports
  flagReason: "string",             // Moderation reason

  // Visibility
  visibility: "string",             // "public", "followers", "private"

  // Reply context (for threaded discussions)
  replyToRantId: "string",          // Parent rant ID (null for top-level)
  replyToAuthorId: "string",        // Parent rant author ID
  isReply: "boolean",               // Is this a reply to another rant

  // Trending algorithm data
  engagementRate: "number",         // Calculated engagement rate
  trendingScore: "number",          // Algorithm-calculated trending score
  lastEngagementAt: "timestamp"     // Last interaction timestamp
}
```

**Indexes**:

- `createdAt` (descending) - chronological feed
- `authorId, createdAt` (composite, descending) - user's rants
- `netScore` (descending) - top-rated content
- `trendingScore` (descending) - trending algorithm
- `tags` (array-contains) - topic-based queries
- `hashtags` (array-contains) - hashtag searches
- `isDeleted, createdAt` (composite) - active content only
- `replyToRantId, createdAt` (composite) - threaded replies
- `engagementRate, createdAt` (composite) - engagement-based feeds

### 4. `comments` Collection

**Document ID**: Auto-generated
**Purpose**: Store comments on rants

```javascript
{
  id: "string",                     // Document ID
  rantId: "string",                 // Parent rant ID
  authorId: "string",               // Comment author UID
  content: "string",                // Comment text

  // Threading support
  parentId: "string",               // Parent comment ID (null for top-level)
  depth: "number",                  // Comment nesting level

  // Timestamps
  createdAt: "timestamp",
  updatedAt: "timestamp",

  // Engagement
  upvotes: "number",
  downvotes: "number",

  // Moderation
  isReported: "boolean",
  reportCount: "number"
}
```

**Indexes**:

- `rantId, createdAt` - comments for a rant
- `authorId, createdAt` - user's comments
- `parentId, createdAt` - threaded replies

### 5. `votes` Collection

**Document ID**: `{userId}_{contentId}`
**Purpose**: Track user votes to prevent duplicates

```javascript
{
  userId: "string",                 // Voter's UID
  contentId: "string",              // Rant or comment ID
  contentType: "string",            // "rant" or "comment"
  voteType: "string",               // "upvote" or "downvote"
  createdAt: "timestamp"
}
```

**Indexes**:

- `userId, createdAt` - user's voting history
- `contentId, voteType` - content vote breakdown

### 6. `follows` Collection

**Document ID**: `{followerId}_{followingId}`
**Purpose**: User follow relationships

```javascript
{
  followerId: "string",             // User doing the following
  followingId: "string",            // User being followed
  createdAt: "timestamp"
}
```

**Indexes**:

- `followerId` - who user follows
- `followingId` - user's followers
- `createdAt` - recent follows

## Subcollections

### User Activity (`users/{uid}/activity`)

**Purpose**: User's personal activity feed

```javascript
{
  type: "string",                   // "rant", "comment", "upvote", etc.
  targetId: "string",               // ID of the content
  createdAt: "timestamp"
}
```

### User Notifications (`users/{uid}/notifications`)

**Purpose**: User notifications

```javascript
{
  type: "string",                   // "follow", "comment", "mention", etc.
  fromUserId: "string",             // Who triggered the notification
  contentId: "string",              // Related content ID
  message: "string",                // Notification text
  isRead: "boolean",
  createdAt: "timestamp"
}
```

## Security Rules Considerations

```javascript
// Users can only edit their own profile
match /users/{userId} {
  allow read: if true;  // Public profiles
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Username documents are read-only after creation
match /usernames/{username} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update, delete: if false;  // Prevent username changes via this collection
}

// Rants are public read, authenticated write
match /rants/{rantId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
}
```

## Query Patterns

### Common Queries

1. **Get user profile**: `users/{uid}`
2. **Check username availability**: `usernames/{username}`
3. **Get user's rants**: `rants.where('authorId', '==', uid).orderBy('createdAt', 'desc')`
4. **Get latest rants**: `rants.orderBy('createdAt', 'desc').limit(20)`
5. **Get rant comments**: `comments.where('rantId', '==', rantId).orderBy('createdAt')`

### Performance Optimizations

- Denormalized counters for fast display
- Composite indexes for efficient filtering
- Username collection for O(1) lookups
- Vote tracking prevents duplicate operations
- Pagination support with `startAfter()`

## Scalability Considerations

1. **Sharding**: Large collections can be sharded by date or user segments
2. **Caching**: Frequently accessed data cached in client/CDN
3. **Aggregation**: Periodic jobs update denormalized counters
4. **Archiving**: Old content moved to separate collections
5. **Rate limiting**: Implemented at application level

## Future Extensions

- **Direct Messages**: `conversations` and `messages` collections
- **Groups/Communities**: `groups` and `memberships` collections
- **Content Moderation**: Enhanced reporting and AI flagging
- **Analytics**: User behavior tracking collections
- **Premium Features**: Subscription and payment tracking
