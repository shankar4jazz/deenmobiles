# Technician Management System - Complete Planning Document

## Overview

This document outlines the complete Technician Management System for DeenMobiles, including assignment workflow, skills management, points system, level promotions, and dashboard enhancements.

---

## Current State Analysis

### Existing Features
| Feature | Status | Location |
|---------|--------|----------|
| User Model with roles | Complete | `schema.prisma` |
| Service Assignment | Complete | `serviceService.ts` |
| TechnicianAssignment UI | Basic | `TechnicianAssignment.tsx` |
| ServiceCategory with `technicianPoints` | Exists (unused) | `schema.prisma` |
| TechnicianPerformanceLog | Model exists (not populated) | `schema.prisma` |
| ServiceRating | Model exists (no API) | `schema.prisma` |
| TechnicianDashboard | Basic stats only | `TechnicianDashboard.tsx` |

### What's Missing
1. Technician skills/specialization mapping
2. Points system implementation
3. Level/promotion system
4. Enhanced assignment UI with workload visibility
5. Technician dashboard with notifications
6. Auto points calculation on service completion

---

## Part 1: Database Schema Changes

### 1.1 New Models

```prisma
// Technician Level System
model TechnicianLevel {
  id                String   @id @default(cuid())
  name              String   // "Junior Technician", "Senior Technician", "Expert Technician"
  code              String   // "JUNIOR", "SENIOR", "EXPERT"
  minPoints         Int      // Minimum points required
  maxPoints         Int?     // Maximum points (null for highest level)
  pointsMultiplier  Float    @default(1.0)  // Bonus multiplier for points
  incentivePercent  Float    @default(0)    // Percentage incentive on service revenue
  badgeColor        String?  // "#FFD700" for gold, etc.
  description       String?
  sortOrder         Int      @default(0)

  companyId         String
  company           Company  @relation(fields: [companyId], references: [id])

  technicians       TechnicianProfile[]
  promotionToThis   TechnicianPromotion[] @relation("PromotedToLevel")
  promotionFromThis TechnicianPromotion[] @relation("PromotedFromLevel")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([companyId, code])
  @@index([companyId])
}

// Technician Profile (Extended User info)
model TechnicianProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Points & Level
  totalPoints         Int      @default(0)
  currentLevelId      String?
  currentLevel        TechnicianLevel? @relation(fields: [currentLevelId], references: [id])
  levelPromotedAt     DateTime?

  // Performance Metrics (cached for quick display)
  totalServicesCompleted Int   @default(0)
  totalRevenue        Decimal  @default(0) @db.Decimal(12, 2)
  averageRating       Float?
  avgCompletionHours  Float?

  // Availability
  isAvailable         Boolean  @default(true)
  maxConcurrentJobs   Int      @default(5)

  companyId           String
  branchId            String
  company             Company  @relation(fields: [companyId], references: [id])
  branch              Branch   @relation(fields: [branchId], references: [id])

  // Relations
  skills              TechnicianSkill[]
  pointsHistory       TechnicianPointsHistory[]
  promotions          TechnicianPromotion[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([companyId, branchId])
  @@index([currentLevelId])
}

// Technician Skills (Service Categories they can work on)
model TechnicianSkill {
  id                  String   @id @default(cuid())
  technicianProfileId String
  technicianProfile   TechnicianProfile @relation(fields: [technicianProfileId], references: [id], onDelete: Cascade)

  serviceCategoryId   String
  serviceCategory     ServiceCategory @relation(fields: [serviceCategoryId], references: [id])

  proficiencyLevel    Int      @default(1)  // 1-5 skill level
  isVerified          Boolean  @default(false)
  verifiedAt          DateTime?
  verifiedBy          String?  // Admin who verified

  createdAt           DateTime @default(now())

  @@unique([technicianProfileId, serviceCategoryId])
  @@index([serviceCategoryId])
}

// Points History (Every point transaction)
model TechnicianPointsHistory {
  id                  String   @id @default(cuid())
  technicianProfileId String
  technicianProfile   TechnicianProfile @relation(fields: [technicianProfileId], references: [id], onDelete: Cascade)

  points              Int      // Can be positive or negative
  type                PointsType
  description         String

  // Reference to source
  serviceId           String?
  service             Service? @relation(fields: [serviceId], references: [id])

  // Bonus info
  bonusMultiplier     Float    @default(1.0)
  basePoints          Int      // Points before multiplier

  createdAt           DateTime @default(now())

  @@index([technicianProfileId])
  @@index([serviceId])
  @@index([createdAt])
}

enum PointsType {
  SERVICE_COMPLETED      // Service marked as completed
  SERVICE_DELIVERED      // Service delivered to customer
  RATING_BONUS           // 5-star rating bonus
  SPEED_BONUS            // Completed faster than average
  DAILY_TARGET_BONUS     // Met daily target
  WEEKLY_TARGET_BONUS    // Met weekly target
  PENALTY_LATE           // Late completion penalty
  PENALTY_REWORK         // Rework/return penalty
  MANUAL_ADJUSTMENT      // Admin manual adjustment
  PROMOTION_BONUS        // Bonus on level promotion
}

// Promotion History
model TechnicianPromotion {
  id                  String   @id @default(cuid())
  technicianProfileId String
  technicianProfile   TechnicianProfile @relation(fields: [technicianProfileId], references: [id])

  fromLevelId         String?
  fromLevel           TechnicianLevel? @relation("PromotedFromLevel", fields: [fromLevelId], references: [id])

  toLevelId           String
  toLevel             TechnicianLevel @relation("PromotedToLevel", fields: [toLevelId], references: [id])

  pointsAtPromotion   Int
  promotedBy          String   // Admin who approved
  notes               String?

  createdAt           DateTime @default(now())

  @@index([technicianProfileId])
}

// Technician Notifications
model TechnicianNotification {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type                NotificationType
  title               String
  message             String
  data                Json?    // Additional data (serviceId, etc.)

  isRead              Boolean  @default(false)
  readAt              DateTime?

  createdAt           DateTime @default(now())

  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  SERVICE_ASSIGNED
  SERVICE_REASSIGNED
  POINTS_EARNED
  LEVEL_PROMOTION
  DAILY_TARGET
  REMINDER
  ANNOUNCEMENT
}
```

### 1.2 Updates to Existing Models

```prisma
// Add to User model
model User {
  // ... existing fields ...

  technicianProfile    TechnicianProfile?
  notifications        TechnicianNotification[]
}

// Add to ServiceCategory model
model ServiceCategory {
  // ... existing fields ...

  technicianSkills     TechnicianSkill[]
}

// Add to Service model
model Service {
  // ... existing fields ...

  pointsHistory        TechnicianPointsHistory[]
}
```

---

## Part 2: Points System Configuration

### 2.1 Default Points Structure

| Action | Base Points | Notes |
|--------|-------------|-------|
| Service Completed | From ServiceCategory.technicianPoints | Default 100 if not set |
| Service Delivered | 20 | Customer picked up |
| 5-Star Rating | 50 | Bonus for excellent service |
| 4-Star Rating | 20 | Good service bonus |
| Speed Bonus | 25 | Completed 20%+ faster than avg |
| Daily Target (5 services) | 100 | Met daily completion target |
| Weekly Target (25 services) | 500 | Met weekly completion target |
| Late Penalty | -20 | Took 50%+ longer than avg |
| Rework Penalty | -50 | Service returned for rework |

### 2.2 Level Multipliers

| Level | Points Required | Multiplier | Incentive % |
|-------|----------------|------------|-------------|
| Trainee | 0 | 0.8x | 0% |
| Junior Technician | 5,000 | 1.0x | 2% |
| Technician | 15,000 | 1.1x | 3% |
| Senior Technician | 50,000 | 1.2x | 5% |
| Expert Technician | 100,000 | 1.5x | 8% |
| Master Technician | 200,000 | 2.0x | 10% |

### 2.3 Points Calculation Formula

```typescript
function calculateServicePoints(
  service: Service,
  technicianProfile: TechnicianProfile,
  rating?: number
): PointsBreakdown {
  const category = service.serviceCategory;
  const basePoints = category.technicianPoints || 100;
  const levelMultiplier = technicianProfile.currentLevel?.pointsMultiplier || 1.0;

  let totalPoints = Math.floor(basePoints * levelMultiplier);
  const breakdown: PointsItem[] = [
    { type: 'SERVICE_COMPLETED', points: totalPoints, description: `${category.name} completed` }
  ];

  // Rating bonus
  if (rating === 5) {
    const ratingBonus = Math.floor(50 * levelMultiplier);
    totalPoints += ratingBonus;
    breakdown.push({ type: 'RATING_BONUS', points: ratingBonus, description: '5-star rating' });
  } else if (rating === 4) {
    const ratingBonus = Math.floor(20 * levelMultiplier);
    totalPoints += ratingBonus;
    breakdown.push({ type: 'RATING_BONUS', points: ratingBonus, description: '4-star rating' });
  }

  // Speed bonus (if completed 20% faster than average)
  if (service.completionTime < technicianProfile.avgCompletionHours * 0.8) {
    const speedBonus = Math.floor(25 * levelMultiplier);
    totalPoints += speedBonus;
    breakdown.push({ type: 'SPEED_BONUS', points: speedBonus, description: 'Fast completion' });
  }

  return { totalPoints, breakdown };
}
```

---

## Part 3: API Endpoints

### 3.1 Technician Profile APIs

```
POST   /api/v1/technicians/profile              - Create technician profile
GET    /api/v1/technicians/profile/:userId      - Get technician profile
PUT    /api/v1/technicians/profile/:userId      - Update technician profile
GET    /api/v1/technicians                      - List technicians (with filters)
GET    /api/v1/technicians/available            - Get available technicians for assignment
```

### 3.2 Skills Management APIs

```
GET    /api/v1/technicians/:id/skills           - Get technician skills
POST   /api/v1/technicians/:id/skills           - Add skill to technician
PUT    /api/v1/technicians/:id/skills/:skillId  - Update skill (proficiency, verify)
DELETE /api/v1/technicians/:id/skills/:skillId  - Remove skill
```

### 3.3 Points APIs

```
GET    /api/v1/technicians/:id/points           - Get points summary
GET    /api/v1/technicians/:id/points/history   - Get points history (paginated)
POST   /api/v1/technicians/:id/points/adjust    - Manual points adjustment (admin)
```

### 3.4 Level & Promotion APIs

```
GET    /api/v1/levels                           - Get all levels
POST   /api/v1/levels                           - Create level (admin)
PUT    /api/v1/levels/:id                       - Update level
GET    /api/v1/technicians/:id/promotions       - Get promotion history
POST   /api/v1/technicians/:id/promote          - Promote technician (admin)
```

### 3.5 Notification APIs

```
GET    /api/v1/notifications                    - Get user notifications
PUT    /api/v1/notifications/:id/read           - Mark as read
PUT    /api/v1/notifications/read-all           - Mark all as read
GET    /api/v1/notifications/unread-count       - Get unread count
```

### 3.6 Enhanced Assignment API

```
GET    /api/v1/services/assignment/technicians  - Get technicians for assignment
       Query params:
       - branchId: Filter by branch
       - categoryId: Filter by skill/category
       - available: Only available technicians
       - sortBy: workload|rating|points

       Response includes:
       - technician details
       - current pending services count
       - skills matching service category
       - average rating
       - current level
```

---

## Part 4: Frontend Components

### 4.1 Enhanced Technician Assignment Component

```
TechnicianAssignmentModal/
├── TechnicianSearch (search input)
├── TechnicianFilters (category, availability)
├── TechnicianList
│   └── TechnicianCard
│       ├── Name & Level Badge
│       ├── Skills Tags
│       ├── Pending Services Count (badge)
│       ├── Average Rating (stars)
│       ├── Points Display
│       └── Assign Button
└── AssignmentNotes (optional notes input)
```

### 4.2 Technician Profile Management

```
TechnicianProfilePage/
├── ProfileHeader
│   ├── Avatar & Name
│   ├── Level Badge & Progress
│   ├── Points Display
│   └── Edit Button
├── SkillsSection
│   ├── SkillsList (category tags with proficiency)
│   ├── AddSkillButton
│   └── SkillEditModal
├── PerformanceStats
│   ├── Services Completed
│   ├── Average Rating
│   ├── Avg Completion Time
│   └── Total Revenue Generated
├── PointsHistory
│   ├── PointsChart (trend)
│   └── PointsTable (history)
└── PromotionHistory
```

### 4.3 Technician Dashboard (Enhanced)

```
TechnicianDashboard/
├── NotificationBell (unread count)
├── StatsCards
│   ├── Today's Assignments
│   ├── Pending Services
│   ├── Points This Month
│   └── Current Level & Progress
├── AssignedServicesList
│   └── ServiceCard
│       ├── Ticket Number
│       ├── Customer & Device
│       ├── Issue
│       ├── Priority Badge
│       ├── Time Elapsed
│       └── Quick Actions (Start, Complete, etc.)
├── PerformanceChart (weekly trend)
└── RecentPointsActivity
```

### 4.4 Admin Technician Management

```
TechnicianManagementPage/
├── TechnicianTable
│   ├── Name & Level
│   ├── Branch
│   ├── Skills Count
│   ├── Pending Services
│   ├── Points & Rating
│   ├── Status Toggle
│   └── Actions (View, Edit, Promote)
├── Filters (branch, level, status)
├── BulkActions
└── AddTechnicianButton
```

---

## Part 5: Workflow Diagrams

### 5.1 Service Assignment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE ASSIGNMENT FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ New Service  │───>│ Click Assign │───>│ Modal Opens  │       │
│  │   Created    │    │   Button     │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 v                │
│                      ┌──────────────────────────────────────┐   │
│                      │     TECHNICIAN SELECTION MODAL       │   │
│                      │  ┌────────────────────────────────┐  │   │
│                      │  │ Search: [_________________]    │  │   │
│                      │  │ Filter: [Category ▼] [Branch ▼]│  │   │
│                      │  └────────────────────────────────┘  │   │
│                      │                                      │   │
│                      │  ┌────────────────────────────────┐  │   │
│                      │  │ 👤 John (Senior)    ⭐ 4.8     │  │   │
│                      │  │    📋 3 pending | 🏆 15,420 pts│  │   │
│                      │  │    Skills: Screen, Battery     │  │   │
│                      │  │                    [Assign]    │  │   │
│                      │  ├────────────────────────────────┤  │   │
│                      │  │ 👤 Sarah (Junior)   ⭐ 4.5     │  │   │
│                      │  │    📋 1 pending | 🏆 5,230 pts │  │   │
│                      │  │    Skills: Screen              │  │   │
│                      │  │                    [Assign]    │  │   │
│                      │  └────────────────────────────────┘  │   │
│                      └──────────────────────────────────────┘   │
│                                                 │                │
│                                                 v                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Notification │<───│   Service    │<───│  Technician  │       │
│  │    Sent      │    │   Assigned   │    │   Selected   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Points Earning Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    POINTS EARNING FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SERVICE COMPLETION                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Technician  │───>│   Status =   │───>│  Calculate   │       │
│  │ Marks Done   │    │  COMPLETED   │    │ Base Points  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 v                │
│                      ┌──────────────────────────────────────┐   │
│                      │        POINTS CALCULATION            │   │
│                      │                                      │   │
│                      │  Base Points (from category): 100    │   │
│                      │  Level Multiplier (Senior 1.2x): 120 │   │
│                      │  Speed Bonus (+25): 145              │   │
│                      │  ─────────────────────               │   │
│                      │  Total: 145 points                   │   │
│                      └──────────────────────────────────────┘   │
│                                                 │                │
│                                                 v                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Update     │<───│   Create     │<───│   Add to     │       │
│  │ Total Points │    │   History    │    │   Profile    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                                    │
│                             v                                    │
│                      ┌──────────────┐                            │
│                      │ Check Level  │                            │
│                      │   Upgrade    │                            │
│                      └──────────────┘                            │
│                             │                                    │
│              ┌──────────────┴──────────────┐                    │
│              v                              v                    │
│       ┌──────────────┐              ┌──────────────┐            │
│       │  No Upgrade  │              │   Eligible   │            │
│       │   Needed     │              │ for Promotion│            │
│       └──────────────┘              └──────────────┘            │
│                                            │                     │
│                                            v                     │
│                                     ┌──────────────┐            │
│                                     │ Notify Admin │            │
│                                     │ for Approval │            │
│                                     └──────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Level Promotion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL PROMOTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Technician  │───>│ Points >= Next│───>│   Notify    │       │
│  │ Earns Points │    │ Level Minimum │    │    Admin    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 v                │
│                      ┌──────────────────────────────────────┐   │
│                      │         ADMIN REVIEW PANEL           │   │
│                      │                                      │   │
│                      │  Technician: John Doe                │   │
│                      │  Current Level: Junior (5,230 pts)   │   │
│                      │  Target Level: Technician (15,000)   │   │
│                      │                                      │   │
│                      │  Requirements:                       │   │
│                      │  ✅ Points: 15,420 / 15,000          │   │
│                      │  ✅ Min Services: 50 / 50            │   │
│                      │  ✅ Avg Rating: 4.5 / 4.0            │   │
│                      │  ✅ Time in Level: 3 months          │   │
│                      │                                      │   │
│                      │  [Approve Promotion] [Defer]         │   │
│                      └──────────────────────────────────────┘   │
│                                                 │                │
│                              ┌──────────────────┴───────────┐   │
│                              v                              v   │
│                       ┌──────────────┐              ┌──────────┐│
│                       │   Approved   │              │ Deferred ││
│                       └──────────────┘              └──────────┘│
│                              │                                   │
│                              v                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Update     │───>│   Create     │───>│   Notify     │       │
│  │    Level     │    │  Promotion   │    │  Technician  │       │
│  │              │    │   Record     │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 v                │
│                                          ┌──────────────┐       │
│                                          │ Award Bonus  │       │
│                                          │   Points     │       │
│                                          └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1-2)
1. Create Prisma migrations for new models
2. Implement TechnicianProfile service
3. Implement TechnicianLevel service
4. Implement Points service with auto-calculation
5. Update Service completion to trigger points
6. Create notification service

### Phase 2: Admin Management UI (Week 2-3)
1. Technician Levels management page
2. Technician Profile management
3. Skills assignment UI
4. Points adjustment UI
5. Promotion workflow UI

### Phase 3: Enhanced Assignment (Week 3)
1. Update TechnicianAssignment component
2. Add workload visibility
3. Add skills filtering
4. Add sorting options

### Phase 4: Technician Dashboard (Week 4)
1. Notification system UI
2. Enhanced service list with quick actions
3. Points & progress display
4. Performance metrics

### Phase 5: Testing & Refinement (Week 5)
1. End-to-end testing
2. Performance optimization
3. Edge case handling
4. Documentation

---

## Part 7: Default Data Setup

### 7.1 Initial Technician Levels

```typescript
const defaultLevels = [
  {
    name: 'Trainee',
    code: 'TRAINEE',
    minPoints: 0,
    maxPoints: 4999,
    pointsMultiplier: 0.8,
    incentivePercent: 0,
    badgeColor: '#9CA3AF', // Gray
    sortOrder: 1
  },
  {
    name: 'Junior Technician',
    code: 'JUNIOR',
    minPoints: 5000,
    maxPoints: 14999,
    pointsMultiplier: 1.0,
    incentivePercent: 2,
    badgeColor: '#10B981', // Green
    sortOrder: 2
  },
  {
    name: 'Technician',
    code: 'TECHNICIAN',
    minPoints: 15000,
    maxPoints: 49999,
    pointsMultiplier: 1.1,
    incentivePercent: 3,
    badgeColor: '#3B82F6', // Blue
    sortOrder: 3
  },
  {
    name: 'Senior Technician',
    code: 'SENIOR',
    minPoints: 50000,
    maxPoints: 99999,
    pointsMultiplier: 1.2,
    incentivePercent: 5,
    badgeColor: '#8B5CF6', // Purple
    sortOrder: 4
  },
  {
    name: 'Expert Technician',
    code: 'EXPERT',
    minPoints: 100000,
    maxPoints: 199999,
    pointsMultiplier: 1.5,
    incentivePercent: 8,
    badgeColor: '#F59E0B', // Orange
    sortOrder: 5
  },
  {
    name: 'Master Technician',
    code: 'MASTER',
    minPoints: 200000,
    maxPoints: null,
    pointsMultiplier: 2.0,
    incentivePercent: 10,
    badgeColor: '#EF4444', // Red/Gold
    sortOrder: 6
  }
];
```

### 7.2 Service Category Points (Update existing)

```typescript
// Update ServiceCategory.technicianPoints for each category
const categoryPoints = {
  'SCREEN_REPAIR': 150,
  'BATTERY_REPLACEMENT': 100,
  'CHARGING_PORT': 120,
  'SOFTWARE': 80,
  'WATER_DAMAGE': 200,
  'MOTHERBOARD': 250,
  'GENERAL_SERVICE': 100
};
```

---

## Part 8: API Response Examples

### 8.1 Get Technicians for Assignment

```json
GET /api/v1/services/assignment/technicians?branchId=xxx&categoryId=yyy

{
  "success": true,
  "data": {
    "technicians": [
      {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "profile": {
          "totalPoints": 15420,
          "currentLevel": {
            "name": "Senior Technician",
            "code": "SENIOR",
            "badgeColor": "#8B5CF6"
          },
          "averageRating": 4.8,
          "totalServicesCompleted": 156,
          "isAvailable": true
        },
        "skills": [
          { "categoryName": "Screen Repair", "proficiencyLevel": 5 },
          { "categoryName": "Battery Replacement", "proficiencyLevel": 4 }
        ],
        "pendingServicesCount": 3,
        "inProgressCount": 2
      }
    ]
  }
}
```

### 8.2 Technician Dashboard Stats

```json
GET /api/v1/dashboard/technician

{
  "success": true,
  "data": {
    "profile": {
      "totalPoints": 15420,
      "currentLevel": "Senior Technician",
      "nextLevel": "Expert Technician",
      "pointsToNextLevel": 84580,
      "progressPercent": 15.4
    },
    "today": {
      "assigned": 5,
      "completed": 2,
      "pending": 3,
      "pointsEarned": 320
    },
    "thisMonth": {
      "servicesCompleted": 45,
      "totalPoints": 5420,
      "averageRating": 4.7,
      "revenue": 125000
    },
    "assignedServices": [
      {
        "id": "srv-123",
        "ticketNumber": "SRV-01-20241201-001",
        "customer": { "name": "Customer Name", "phone": "9876543210" },
        "deviceModel": "iPhone 14",
        "issue": "Screen cracked",
        "status": "PENDING",
        "assignedAt": "2024-12-01T10:00:00Z",
        "priority": "HIGH"
      }
    ],
    "notifications": {
      "unreadCount": 3
    }
  }
}
```

---

## Part 9: UI Mockups

### 9.1 Technician Assignment Dropdown

```
┌────────────────────────────────────────────────────┐
│ ASSIGN TECHNICIAN                              [X] │
├────────────────────────────────────────────────────┤
│ 🔍 Search technician...                            │
├────────────────────────────────────────────────────┤
│ Filter: [All Skills ▼]  Sort: [Workload ▼]         │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ 👤 John Doe                                    │ │
│ │ 🏆 Senior Technician    ⭐ 4.8 (156 reviews)   │ │
│ │ 📋 Pending: 3  |  🔧 In Progress: 2            │ │
│ │ Skills: Screen ••••• Battery ••••              │ │
│ │                                    [ASSIGN]    │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ 👤 Sarah Smith                                 │ │
│ │ 🏆 Junior Technician    ⭐ 4.5 (42 reviews)    │ │
│ │ 📋 Pending: 1  |  🔧 In Progress: 1            │ │
│ │ Skills: Screen •••                             │ │
│ │                                    [ASSIGN]    │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ 👤 Mike Johnson                                │ │
│ │ 🏆 Technician           ⭐ 4.6 (89 reviews)    │ │
│ │ 📋 Pending: 5  |  🔧 In Progress: 3            │ │
│ │ Skills: Screen •••• Software ••••              │ │
│ │                                    [ASSIGN]    │ │
│ └────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────┤
│ Notes: [Optional assignment notes...            ]  │
└────────────────────────────────────────────────────┘
```

### 9.2 Technician Dashboard Header

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 John Doe                                         🔔 (3)      │
│ Senior Technician 🏆                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ Today's     │  │   Points    │  │   Rating    │  │  Level  ││
│  │ Services    │  │ This Month  │  │             │  │Progress ││
│  │             │  │             │  │             │  │         ││
│  │    5        │  │   5,420     │  │   ⭐ 4.8    │  │  ████░░ ││
│  │ 2 completed │  │  +320 today │  │ 156 reviews │  │  54%    ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                  │
│  Next Level: Expert Technician (84,580 points needed)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 10: Files to Create/Modify

### Backend Files

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add new models |
| `src/services/technicianService.ts` | Create | Technician profile CRUD |
| `src/services/pointsService.ts` | Create | Points calculation & history |
| `src/services/levelService.ts` | Create | Level management |
| `src/services/notificationService.ts` | Create | Notification CRUD |
| `src/controllers/technicianController.ts` | Create | API handlers |
| `src/routes/technicianRoutes.ts` | Create | Route definitions |
| `src/services/serviceService.ts` | Modify | Add points trigger on completion |
| `src/services/dashboardService.ts` | Modify | Enhanced technician stats |

### Frontend Files

| File | Action | Description |
|------|--------|-------------|
| `src/services/technicianApi.ts` | Create | API client |
| `src/components/services/TechnicianAssignment.tsx` | Modify | Enhanced assignment UI |
| `src/components/technician/TechnicianCard.tsx` | Create | Technician display card |
| `src/components/technician/SkillsManager.tsx` | Create | Skills management |
| `src/components/technician/PointsHistory.tsx` | Create | Points history display |
| `src/components/technician/LevelBadge.tsx` | Create | Level badge component |
| `src/components/common/NotificationBell.tsx` | Create | Notification bell |
| `src/pages/dashboard/TechnicianDashboard.tsx` | Modify | Enhanced dashboard |
| `src/pages/admin/TechnicianManagement.tsx` | Create | Admin management page |
| `src/pages/admin/LevelManagement.tsx` | Create | Level configuration |

---

## Part 11: Multi-Branch Role Hierarchy

### 11.1 Role Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANY LEVEL                                 │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ SUPER_ADMIN  │───>│    ADMIN     │                           │
│  │ (System)     │    │  (Company)   │                           │
│  └──────────────┘    └──────────────┘                           │
│                             │                                    │
│                             │ Creates                            │
│                             v                                    │
├─────────────────────────────────────────────────────────────────┤
│                    BRANCH LEVEL                                  │
│                                                                  │
│           ┌──────────────────────────────────────┐              │
│           │          BRANCH_ADMIN                │              │
│           │  (Manages entire branch)             │              │
│           └──────────────────────────────────────┘              │
│                             │                                    │
│              ┌──────────────┼──────────────┐                    │
│              │ Creates      │ Creates      │ Creates            │
│              v              v              v                    │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│     │SERVICE_ADMIN │ │ RECEPTIONIST │ │  TECHNICIAN  │         │
│     │(Assigns work)│ │(Creates svc) │ │ (Does work)  │         │
│     └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Role Permissions

| Role | Create Users | Assign Services | Update Service | View Services |
|------|-------------|-----------------|----------------|---------------|
| SUPER_ADMIN | All roles | All branches | All | All |
| ADMIN | Branch-level roles | All branches | All | All |
| BRANCH_ADMIN | Service Admin, Receptionist, Technician | Own branch | Own branch | Own branch |
| SERVICE_ADMIN | None | Own branch technicians | Own branch | Own branch |
| RECEPTIONIST | None | None | Create only | Own branch |
| TECHNICIAN | None | None | Assigned only | Assigned only |

### 11.3 User Creation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│               BRANCH_ADMIN Creates Users                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Create SERVICE_ADMIN                                         │
│     ┌────────────────────────────────────────────────────────┐  │
│     │ Name: [Service Admin Name]                             │  │
│     │ Email: [serviceadmin@branch.com]                       │  │
│     │ Phone: [9876543210]                                    │  │
│     │ Role: SERVICE_ADMIN                                    │  │
│     │ Branch: [Auto-filled - Branch Admin's branch]          │  │
│     │ Password: [Auto-generated / Set manually]              │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│  2. Create TECHNICIAN                                            │
│     ┌────────────────────────────────────────────────────────┐  │
│     │ Name: [Technician Name]                                │  │
│     │ Email: [tech@branch.com]                               │  │
│     │ Phone: [9876543210]                                    │  │
│     │ Role: TECHNICIAN                                       │  │
│     │ Branch: [Auto-filled - Branch Admin's branch]          │  │
│     │ Password: [Auto-generated / Set manually]              │  │
│     │                                                        │  │
│     │ -- Technician Profile (Auto-created) --                │  │
│     │ Skills: [Select service categories]                    │  │
│     │ Max Jobs: [5]                                          │  │
│     │ Starting Level: [Trainee]                              │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│  3. Create RECEPTIONIST                                          │
│     ┌────────────────────────────────────────────────────────┐  │
│     │ Name: [Receptionist Name]                              │  │
│     │ Email: [reception@branch.com]                          │  │
│     │ Phone: [9876543210]                                    │  │
│     │ Role: RECEPTIONIST                                     │  │
│     │ Branch: [Auto-filled - Branch Admin's branch]          │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.4 Login & Dashboard by Role

| Role | Login Access | Dashboard Shows |
|------|-------------|-----------------|
| BRANCH_ADMIN | Branch admin panel | All branch stats, user management, reports |
| SERVICE_ADMIN | Service admin panel | All branch services, technician workload, assignment |
| RECEPTIONIST | Reception panel | Create service, customer lookup, pending services |
| TECHNICIAN | Technician app/panel | Only assigned services, personal stats, notifications |

### 11.5 Technician Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICIAN LOGIN FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Technician  │───>│    Login     │───>│   Validate   │       │
│  │  Opens App   │    │   Screen     │    │ Credentials  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 v                │
│                      ┌──────────────────────────────────────┐   │
│                      │         CHECK USER ROLE              │   │
│                      │                                      │   │
│                      │  if (role === 'TECHNICIAN') {        │   │
│                      │    redirect to TechnicianDashboard   │   │
│                      │  }                                   │   │
│                      └──────────────────────────────────────┘   │
│                                                 │                │
│                                                 v                │
│                      ┌──────────────────────────────────────┐   │
│                      │       TECHNICIAN DASHBOARD           │   │
│                      │                                      │   │
│                      │  Query: services WHERE               │   │
│                      │    assignedToId = currentUserId      │   │
│                      │    AND branchId = user.branchId      │   │
│                      │                                      │   │
│                      │  Shows:                              │   │
│                      │  - Only assigned services            │   │
│                      │  - Personal stats & points           │   │
│                      │  - Notifications                     │   │
│                      │  - Status update options             │   │
│                      └──────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.6 Service Admin Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICE ADMIN WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SERVICE_ADMIN can:                                              │
│  ✅ View all services in their branch                           │
│  ✅ Assign services to technicians (same branch only)           │
│  ✅ Reassign services between technicians                       │
│  ✅ View technician workload and availability                   │
│  ✅ Update service status                                       │
│  ✅ Add notes to services                                       │
│  ❌ Cannot create new users                                     │
│  ❌ Cannot access other branches                                │
│  ❌ Cannot delete services                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SERVICE ADMIN DASHBOARD                      │   │
│  │                                                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │ Unassigned │ │  Pending   │ │In Progress │            │   │
│  │  │    12      │ │     8      │ │     15     │            │   │
│  │  └────────────┘ └────────────┘ └────────────┘            │   │
│  │                                                          │   │
│  │  TECHNICIAN WORKLOAD                                     │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ 👤 John (Senior)     Pending: 3  In Progress: 2  │    │   │
│  │  │ 👤 Sarah (Junior)    Pending: 1  In Progress: 1  │    │   │
│  │  │ 👤 Mike (Technician) Pending: 5  In Progress: 3  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  UNASSIGNED SERVICES (Click to assign)                   │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │ SRV-001 | iPhone 14 | Screen repair  [Assign ▼] │    │   │
│  │  │ SRV-002 | Samsung   | Battery issue  [Assign ▼] │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.7 API Access Control

```typescript
// Middleware for role-based access
const rolePermissions = {
  TECHNICIAN: {
    services: {
      read: 'assigned_only',    // Only services assigned to them
      update: 'status_only',    // Can only update status
      delete: false
    },
    users: { read: false, create: false, update: false, delete: false }
  },

  SERVICE_ADMIN: {
    services: {
      read: 'branch_only',      // All services in their branch
      update: 'branch_only',    // Can update any service in branch
      assign: 'branch_only',    // Can assign to branch technicians
      delete: false
    },
    users: { read: 'branch_technicians', create: false, update: false, delete: false }
  },

  BRANCH_ADMIN: {
    services: {
      read: 'branch_only',
      update: 'branch_only',
      assign: 'branch_only',
      delete: 'branch_only'
    },
    users: {
      read: 'branch_only',
      create: ['SERVICE_ADMIN', 'RECEPTIONIST', 'TECHNICIAN'],
      update: 'branch_only',
      delete: 'branch_only'
    }
  }
};
```

### 11.8 Branch Data Isolation

```typescript
// All queries for branch-level users automatically filter by branchId

// Technician sees only assigned services
const getTechnicianServices = (userId: string, branchId: string) => {
  return prisma.service.findMany({
    where: {
      assignedToId: userId,
      branchId: branchId
    }
  });
};

// Service Admin sees all branch services
const getServiceAdminServices = (branchId: string) => {
  return prisma.service.findMany({
    where: {
      branchId: branchId
    }
  });
};

// Service Admin gets only branch technicians for assignment
const getBranchTechnicians = (branchId: string) => {
  return prisma.user.findMany({
    where: {
      branchId: branchId,
      role: 'TECHNICIAN',
      isActive: true
    },
    include: {
      technicianProfile: true,
      assignedServices: {
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] }
        }
      }
    }
  });
};
```

---

## Part 12: Existing Roles in System

The system already has these roles defined in `schema.prisma`:

```prisma
enum UserRole {
  SUPER_ADMIN       // System-wide access
  ADMIN             // Company-level admin
  MANAGER           // Can manage services
  TECHNICIAN        // Repairs devices
  RECEPTIONIST      // Creates services
  BRANCH_ADMIN      // Manages single branch
  SERVICE_ADMIN     // Assigns services
  SERVICE_MANAGER   // Manages service operations
  CUSTOMER_SUPPORT  // Customer facing
}
```

**Already Implemented:**
- ✅ User model with `branchId` field
- ✅ Service model with `branchId` and `assignedToId`
- ✅ Role-based routing in frontend
- ✅ TechnicianDashboard exists (needs enhancement)

**Needs Implementation:**
- ⬜ Strict branch filtering in all queries
- ⬜ SERVICE_ADMIN dashboard and assignment UI
- ⬜ Branch-scoped user creation by BRANCH_ADMIN
- ⬜ Enhanced TechnicianDashboard with assigned services only

---

## Summary

This Technician Management System will provide:

1. **Smart Assignment** - See workload, skills, and ratings when assigning
2. **Gamification** - Points system motivates technicians
3. **Career Growth** - Clear path from Junior to Master level
4. **Performance Tracking** - Detailed metrics and history
5. **Real-time Notifications** - Technicians know immediately when assigned
6. **Admin Control** - Full visibility and control over promotions

Ready to start implementation? We'll begin with Phase 1 (Database & Backend).
