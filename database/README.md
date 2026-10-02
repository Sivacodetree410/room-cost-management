# SQL Server Database Architecture for Bachelor Room Cost Management System (RCMS)

This directory contains the complete Microsoft SQL Server / SSMS database script for the **Bachelor Room Cost Management System**.

## 📁 File Reference
- **Script File**: [`database/RCMS_Bachelor_Database_Setup.sql`](file:///d:/Siva/room-cost-management/database/RCMS_Bachelor_Database_Setup.sql)
- **Target DBMS**: Microsoft SQL Server 2016 / 2017 / 2019 / 2022, Azure SQL Database
- **Tool**: SQL Server Management Studio (SSMS) / Azure Data Studio

---

## 🚀 How to Execute in SSMS
1. Open **SQL Server Management Studio (SSMS)**.
2. Connect to your SQL Server instance (e.g., `localhost`, `.\SQLEXPRESS`, or your server name).
3. Open [`RCMS_Bachelor_Database_Setup.sql`](file:///d:/Siva/room-cost-management/database/RCMS_Bachelor_Database_Setup.sql) (`File -> Open -> File` or press `Ctrl + O`).
4. Click **Execute** or press **F5**.
5. The script will automatically:
   - Create the `RCMS_BachelorDB` database (if not existing).
   - Create all 5 relational tables with primary keys, foreign keys, and check constraints.
   - Deploy scalar and table-valued functions for prorated day rate calculations.
   - Deploy automated triggers for bed occupancy and real-time payment reconciliation.
   - Deploy stored procedures for room allocations, expense entries, split generation, and UPI payments.
   - Deploy 4 views for reports (Cot Occupancy, Monthly Bills, Roommate Dues, Vacated History).
   - Seed the exact June 2026 Room 101 data (Siva, Kumar, Rahul with ₹15,000 bills).
   - Run verification queries and output the results.

---

## 🗄️ Database Schema & Tables

### 1. `dbo.tbl_Rooms` (1. Room Master)
Stores room specifications and cot capacity.
- `RoomId` (INT, PK, Identity)
- `RoomNo` (NVARCHAR(50), Unique) - e.g., `'Room 101'`
- `RoomName` (NVARCHAR(150)) - e.g., `'Bachelors Haven (Boys Sharing)'`
- `MaxCapacity` (INT) - e.g., `3` beds/cots
- `CurrentMembers` (INT) - Auto-maintained by trigger
- `BaseRent` (DECIMAL(18,2)) - Monthly rent paid to landlord (e.g., `₹9,000.00`)
- `DepositAmount` (DECIMAL(18,2)) - Security deposit paid to owner
- `Status` (NVARCHAR(50)) - `'Available'`, `'Full'`, or `'Maintenance'`
- `Floor`, `Amenities`, `Notes`, `CreatedAt`, `UpdatedAt`

### 2. `dbo.tbl_Roommates` (2. Member Allocation)
Tracks bachelor roommates joining and leaving at any time.
- `MemberId` (INT, PK, Identity)
- `MemberCode` (NVARCHAR(50), Unique) - e.g., `'BR-101'`
- `RoomId` (INT, FK)
- `MemberName` (NVARCHAR(100)) - e.g., `'Siva'`, `'Kumar'`, `'Rahul'`
- `Phone` (NVARCHAR(25)), `Email` (NVARCHAR(150))
- `JoinDate` (DATE) - Move-in date
- `LeaveDate` (DATE, Nullable) - Move-out date (NULL if currently active)
- `Status` (NVARCHAR(20)) - `'Active'` or `'Vacated'`
- `CollegeOrCompany`, `Hometown`, `UpiId`, `DepositPaid`, `EmergencyContact`

### 3. `dbo.tbl_Expenses` (3. Expense Entry)
Monthly shared room bills.
- `ExpenseId` (INT, PK, Identity)
- `RoomId` (INT, FK)
- `BillingMonth` (CHAR(7)) - e.g., `'2026-06'`
- `Category` (NVARCHAR(50)) - `'Rent'`, `'Electricity'`, `'Water'`, `'Internet'`, `'Cleaning'`, `'Other'`
- `Title` (NVARCHAR(200)) - e.g., `'EB Power Meter Bill'`, `'Drinking Water 20L Bubble Cans'`
- `Amount` (DECIMAL(18,2))
- `BillDate` (DATE)
- `PaidBy` (NVARCHAR(100)) - e.g., `'Siva'`, `'Kumar'`, `'Room Pool'`
- `PaidByMemberId` (INT, FK, Nullable)
- `ReceiptNo`, `Notes`, `CreatedAt`

### 4. `dbo.tbl_MemberPayments` (5. Payment Screen & Dues)
Calculated monthly shares and dues for each roommate.
- `PaymentId` (INT, PK, Identity)
- `MemberId` (INT, FK), `RoomId` (INT, FK)
- `BillingMonth` (CHAR(7))
- `DaysStayed` (INT) - Days occupied in this month
- `TotalRoomDays` (INT) - Total combined occupied days in room
- `CalculatedShare` (DECIMAL(18,2)) - Dynamic prorated share
- `PaidAmount` (DECIMAL(18,2)) - Auto-maintained by trigger from transactions
- `DueAmount` (Computed Column) - `AS (CalculatedShare - PaidAmount)`
- `Status` (NVARCHAR(20)) - `'Paid'`, `'Partial'`, `'Due'`, `'Overdue'`
- `DueDate` (DATE), `UpiId` (NVARCHAR(100)), `UpdatedAt`

### 5. `dbo.tbl_PaymentTransactions` (Transaction Ledger)
Detailed ledger for UPI, Cash, and NetBanking payments.
- `TransactionId` (INT, PK, Identity)
- `PaymentId` (INT, FK)
- `PaymentDate` (DATE)
- `Amount` (DECIMAL(18,2))
- `PaymentMode` (NVARCHAR(50)) - `'UPI'`, `'Cash'`, `'NetBanking'`, `'Card'`
- `ReferenceNo` (NVARCHAR(100)) - e.g., `'UPI/617283948/GPay'`
- `Notes` (NVARCHAR(MAX)), `RecordedAt`

---

## 🧮 Mathematical Prorating Engine (Functions)

### `dbo.fn_GetDaysOccupiedInMonth(@JoinDate, @LeaveDate, @BillingMonth)`
Calculates the exact active staying days of a roommate in any given month:
$$\text{Days} = \text{DATEDIFF(DAY, EffectiveStart, EffectiveEnd)} + 1$$

### `dbo.tvf_CalculateRoommateDynamicSplit(@RoomId, @BillingMonth, @SplitMode)`
Calculates the dynamic split for all roommates in a room for a given month:
$$\text{Day Rate} = \frac{\text{Total Monthly Expenses}}{\text{Total Combined Occupied Days}}$$
$$\text{Member Share} = \text{Day Rate} \times \text{Days Stayed}$$

---

## ⚙️ Automated Triggers

1. **`dbo.trg_Roommates_UpdateRoomOccupancy`**:
   - Executes after `INSERT`, `UPDATE`, or `DELETE` on `tbl_Roommates`.
   - Automatically re-counts `CurrentMembers` in `tbl_Rooms`.
   - Sets status to `'Full'` if `CurrentMembers >= MaxCapacity`, otherwise `'Available'`.

2. **`dbo.trg_PaymentTransactions_UpdatePaymentStatus`**:
   - Executes after `INSERT`, `UPDATE`, or `DELETE` on `tbl_PaymentTransactions`.
   - Automatically sums up transactions to update `PaidAmount` in `tbl_MemberPayments`.
   - Automatically changes payment status to `'Paid'` when fully cleared, `'Partial'` when partial, or `'Due'`.

---

## 📦 Stored Procedures (API / Backend Ready)

| Procedure Name | Purpose | Parameters |
| :--- | :--- | :--- |
| `dbo.usp_AllocateRoommate` | Adds a new roommate with room bed capacity check | `@RoomNo, @MemberName, @Phone, @Email, @JoinDate, ...` |
| `dbo.usp_VacateRoommate` | Marks roommate vacated, sets leave date, frees cot | `@MemberId, @LeaveDate` |
| `dbo.usp_AddExpense` | Logs a room monthly bill | `@RoomNo, @BillingMonth, @Category, @Title, @Amount, ...` |
| `dbo.usp_GenerateAndSyncMonthlySplit` | Runs dynamic split math and populates payment dues | `@RoomNo, @BillingMonth, @SplitMode ('prorated' / 'equal')` |
| `dbo.usp_RecordRoommatePayment` | Records a UPI/Cash payment transaction | `@MemberId, @BillingMonth, @Amount, @PaymentMode, @ReferenceNo, ...` |
| `dbo.usp_GetRoommateMonthlySplitSummary` | Returns high-level summary and itemized split | `@RoomNo, @BillingMonth, @SplitMode` |

---

## 📊 Reporting Views (6. Reports)

1. **`dbo.vw_RoomCotOccupancyReport`**: Cot capacity, current occupancy, occupancy %, vacant cots, and active roommates list.
2. **`dbo.vw_MonthlyCostReport`**: Pivot view with Rent, Electricity, Water Cans, Wi-Fi, Maid, Other, Total Bills, and average cost per boy.
3. **`dbo.vw_MemberDueReport`**: Outstanding dues, payment status, and formatted **WhatsApp reminder text**.
4. **`dbo.vw_VacatedMembersReport`**: Historical log of departed roommates, stay duration in days, and settlement status.
