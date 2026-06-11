# Inventory Management SaaS

## Project Overview

This is a multi-company inventory management SaaS for footwear shops.

The first company using the system is Step Enterprise.

The application must be mobile-first, PWA-ready, and production-ready.

---

# Tech Stack

## Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI
- Axios
- Zustand

## Backend

- Next.js Route Handlers
- Auth.js
- Zod Validation

## Database

- PostgreSQL
- Prisma ORM

## Additional

- Cloudinary
- Recharts
- Nodemailer

## Package Manager

Always use pnpm.

Never use npm commands.

---

# Multi-Tenancy Rules

Every business record belongs to a company.

Always use:

```prisma
companyId String
```

and

```prisma
company Company @relation(
  fields: [companyId],
  references: [id]
)
```

Use Company.id as the foreign key.

Never use company code as a foreign key.

Company code is for display and login purposes only.

---

# ID Rules

Use:

```prisma
id String @id @default(cuid())
```

Do not use:

```prisma
Int @id @default(autoincrement())
```

---

# User Roles

## SUPER_ADMIN

Platform owner.

Can:

- Manage companies
- Manage company onboarding
- View all companies

companyId = null

## ADMIN

Company owner.

Can:

- Manage products
- Manage suppliers
- Manage users
- Manage inventory
- Manage reports
- Manage settings

## MANAGER

Can:

- Manage stock
- Create purchase orders
- Receive stock
- Create sales
- Transfer stock
- View reports

Cannot manage company settings.

## STAFF

Can:

- View inventory
- Search products
- Create sales
- Update stock

Cannot manage users or settings.

---

# Authentication Rules

Company users login with:

- Company Code
- Username
- Password

Usernames are generated like:

- admin01
- admin02
- manager01
- staff01

Username uniqueness:

```prisma
@@unique([companyId, username])
```

Super Admin login is separate.

---

# Inventory Rules

Only two stock locations exist:

- SHOP
- GODOWN

No additional locations should be added.

---

# Product Rules

Product contains:

- Article No
- Article Name
- Brand
- Category
- Selling Price
- Default Purchase Price

Variants contain:

- Size
- Color
- Size Type
- Shop Quantity
- Godown Quantity
- Min Stock

Size is stored as:

```prisma
size String
```

Size Type is a fixed category, stored as an enum (default BIG):

```prisma
enum SizeType {
  BIG
  SMALL
}

sizeType SizeType @default(BIG)
```

Size + Color + Size Type together identify a variant:

```prisma
@@unique([companyId, productId, size, color, sizeType])
```

Do not create:

- sizeNumber

---

# Purchase Order Rules

Statuses:

- DRAFT
- PENDING
- PARTIAL
- RECEIVED
- CANCELLED

Pending quantity must be calculated.

Never store pending quantity.

Formula:

orderedQty - receivedQty

---

# Stock Transfer Rules

Transfers only between:

- SHOP
- GODOWN

---

# Inventory Movement Rules

Every stock change must create an InventoryMovement record.

Movement types:

- PURCHASE
- SALE
- TRANSFER_IN
- TRANSFER_OUT
- ADJUSTMENT
- PURCHASE_RETURN
- SALES_RETURN

InventoryMovement is the source of truth for stock history.

---

# Prisma Rules

Models:

PascalCase

Example:

```prisma
model Product
```

Fields:

camelCase

Example:

```prisma
articleNo
articleName
createdAt
```

Database tables:

snake_case

Use:

```prisma
@map()
@@map()
```

---

# UI Rules

Use the project's dark theme with red accents.

Requirements:

- Mobile-first
- Responsive
- Dark mode
- Light mode
- Shadcn UI
- TypeScript strict mode

All new pages must support both dark and light mode.

---

# Development Rules

Do not rebuild existing files unnecessarily.

Reuse existing components whenever possible.

Follow existing folder structure.

Keep code modular, typed, and production-ready.

Prefer reusable components over duplicated code.
