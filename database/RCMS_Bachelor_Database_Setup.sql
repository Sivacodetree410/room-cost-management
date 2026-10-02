/*
====================================================================================================
 DATABASE SETUP SCRIPT FOR SQL SERVER MANAGEMENT STUDIO (SSMS)
 PROJECT: Room Cost Management System (RCMS) - Bachelor Room & Roommates Sharing
 TARGET DBMS: Microsoft SQL Server 2016 / 2019 / 2022 / Azure SQL
 CREATED FOR: Bachelor boys sharing a room/flat with dynamic prorated occupancy expense splitting
====================================================================================================

 MODULES COVERED:
 1. Room Master (Single Room / Flat Cot Capacity, Base Rent, Advance Deposit, Amenities, Status)
 2. Member Allocation (Bachelor Roommates join/vacate tracking, UPI ID, College/Company, Hometown)
 3. Expense Entry (Rent, Electricity, Drinking Water Cans, Wi-Fi, Maid Cleaning, Other Groceries)
 4. Dynamic Cost Split Engine (Prorated days-stayed calculation & flat equal split)
 5. Payment Screen & Transactions (Calculated Shares, UPI / Cash Transactions, Real-time Dues)
 6. Reports (Cot Occupancy, Monthly Bills, Roommate Dues & WhatsApp Reminder, Vacated History)
====================================================================================================
*/

-- -------------------------------------------------------------------------------------------------
-- STEP 1: CREATE DATABASE
-- -------------------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'RCMS_BachelorDB')
BEGIN
    PRINT '>> Creating Database: RCMS_BachelorDB...';
    CREATE DATABASE RCMS_BachelorDB;
END
GO

USE RCMS_BachelorDB;
GO

PRINT '>> Setting up Database Options & ANSI Defaults...';
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 2: DROP EXISTING OBJECTS (CLEAN RE-RUN SUPPORT)
-- -------------------------------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_PaymentTransactions_UpdatePaymentStatus', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_PaymentTransactions_UpdatePaymentStatus;
IF OBJECT_ID('dbo.trg_Roommates_UpdateRoomOccupancy', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_Roommates_UpdateRoomOccupancy;

IF OBJECT_ID('dbo.usp_RecordRoommatePayment', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_RecordRoommatePayment;
IF OBJECT_ID('dbo.usp_GenerateAndSyncMonthlySplit', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_GenerateAndSyncMonthlySplit;
IF OBJECT_ID('dbo.usp_AddExpense', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_AddExpense;
IF OBJECT_ID('dbo.usp_VacateRoommate', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_VacateRoommate;
IF OBJECT_ID('dbo.usp_AllocateRoommate', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_AllocateRoommate;
IF OBJECT_ID('dbo.usp_GetRoommateMonthlySplitSummary', 'P') IS NOT NULL DROP PROCEDURE dbo.usp_GetRoommateMonthlySplitSummary;

IF OBJECT_ID('dbo.vw_VacatedMembersReport', 'V') IS NOT NULL DROP VIEW dbo.vw_VacatedMembersReport;
IF OBJECT_ID('dbo.vw_MemberDueReport', 'V') IS NOT NULL DROP VIEW dbo.vw_MemberDueReport;
IF OBJECT_ID('dbo.vw_MonthlyCostReport', 'V') IS NOT NULL DROP VIEW dbo.vw_MonthlyCostReport;
IF OBJECT_ID('dbo.vw_RoomCotOccupancyReport', 'V') IS NOT NULL DROP VIEW dbo.vw_RoomCotOccupancyReport;

IF OBJECT_ID('dbo.tvf_CalculateRoommateDynamicSplit', 'IF') IS NOT NULL DROP FUNCTION dbo.tvf_CalculateRoommateDynamicSplit;
IF OBJECT_ID('dbo.fn_GetDaysOccupiedInMonth', 'FN') IS NOT NULL DROP FUNCTION dbo.fn_GetDaysOccupiedInMonth;

IF OBJECT_ID('dbo.tbl_PaymentTransactions', 'U') IS NOT NULL DROP TABLE dbo.tbl_PaymentTransactions;
IF OBJECT_ID('dbo.tbl_MemberPayments', 'U') IS NOT NULL DROP TABLE dbo.tbl_MemberPayments;
IF OBJECT_ID('dbo.tbl_Expenses', 'U') IS NOT NULL DROP TABLE dbo.tbl_Expenses;
IF OBJECT_ID('dbo.tbl_Roommates', 'U') IS NOT NULL DROP TABLE dbo.tbl_Roommates;
IF OBJECT_ID('dbo.tbl_Rooms', 'U') IS NOT NULL DROP TABLE dbo.tbl_Rooms;
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 3: CREATE CORE TABLES
-- -------------------------------------------------------------------------------------------------

-- 1. ROOM MASTER TABLE (Store room details only)
PRINT '>> Creating Table: tbl_Rooms (1. Room Master)...';
CREATE TABLE dbo.tbl_Rooms (
    RoomId          INT IDENTITY(1,1) PRIMARY KEY,
    RoomNo          NVARCHAR(50) NOT NULL CONSTRAINT UQ_tbl_Rooms_RoomNo UNIQUE,
    RoomName        NVARCHAR(150) NOT NULL,
    MaxCapacity     INT NOT NULL CONSTRAINT CK_tbl_Rooms_MaxCapacity CHECK (MaxCapacity > 0),
    CurrentMembers  INT NOT NULL CONSTRAINT DF_tbl_Rooms_CurrentMembers DEFAULT (0),
    BaseRent        DECIMAL(18, 2) NOT NULL CONSTRAINT CK_tbl_Rooms_BaseRent CHECK (BaseRent >= 0),
    DepositAmount   DECIMAL(18, 2) NOT NULL CONSTRAINT DF_tbl_Rooms_DepositAmount DEFAULT (0),
    Status          NVARCHAR(50) NOT NULL CONSTRAINT DF_tbl_Rooms_Status DEFAULT ('Available')
                    CONSTRAINT CK_tbl_Rooms_Status CHECK (Status IN ('Available', 'Full', 'Maintenance')),
    Floor           NVARCHAR(50) NULL,
    Amenities       NVARCHAR(MAX) NULL,
    Notes           NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_Rooms_CreatedAt DEFAULT (SYSDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_Rooms_UpdatedAt DEFAULT (SYSDATETIME())
);
GO

-- 2. MEMBER ALLOCATION TABLE (Bachelor Roommates join / vacate anytime)
PRINT '>> Creating Table: tbl_Roommates (2. Member Allocation)...';
CREATE TABLE dbo.tbl_Roommates (
    MemberId         INT IDENTITY(1,1) PRIMARY KEY,
    MemberCode       NVARCHAR(50) NOT NULL CONSTRAINT UQ_tbl_Roommates_MemberCode UNIQUE,
    RoomId           INT NOT NULL CONSTRAINT FK_tbl_Roommates_tbl_Rooms FOREIGN KEY REFERENCES dbo.tbl_Rooms(RoomId) ON DELETE CASCADE,
    MemberName       NVARCHAR(100) NOT NULL,
    Phone            NVARCHAR(25) NOT NULL,
    Email            NVARCHAR(150) NULL,
    JoinDate         DATE NOT NULL,
    LeaveDate        DATE NULL,
    Status           NVARCHAR(20) NOT NULL CONSTRAINT DF_tbl_Roommates_Status DEFAULT ('Active')
                     CONSTRAINT CK_tbl_Roommates_Status CHECK (Status IN ('Active', 'Vacated')),
    CollegeOrCompany NVARCHAR(150) NULL,
    Hometown         NVARCHAR(100) NULL,
    UpiId            NVARCHAR(100) NULL,
    DepositPaid      DECIMAL(18, 2) NOT NULL CONSTRAINT DF_tbl_Roommates_DepositPaid DEFAULT (0),
    EmergencyContact NVARCHAR(150) NULL,
    Notes            NVARCHAR(MAX) NULL,
    CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_Roommates_CreatedAt DEFAULT (SYSDATETIME()),
    CONSTRAINT CK_tbl_Roommates_Dates CHECK (LeaveDate IS NULL OR LeaveDate >= JoinDate)
);
GO

-- 3. EXPENSE ENTRY TABLE (Monthly Room Expenses)
PRINT '>> Creating Table: tbl_Expenses (3. Expense Entry)...';
CREATE TABLE dbo.tbl_Expenses (
    ExpenseId       INT IDENTITY(1,1) PRIMARY KEY,
    RoomId          INT NOT NULL CONSTRAINT FK_tbl_Expenses_tbl_Rooms FOREIGN KEY REFERENCES dbo.tbl_Rooms(RoomId) ON DELETE CASCADE,
    BillingMonth    CHAR(7) NOT NULL CONSTRAINT CK_tbl_Expenses_BillingMonth CHECK (BillingMonth LIKE '[0-9][0-9][0-9][0-9]-[0-1][0-9]'), -- 'YYYY-MM'
    Category        NVARCHAR(50) NOT NULL
                    CONSTRAINT CK_tbl_Expenses_Category CHECK (Category IN ('Rent', 'Electricity', 'Water', 'Internet', 'Cleaning', 'Other')),
    Title           NVARCHAR(200) NOT NULL,
    Amount          DECIMAL(18, 2) NOT NULL CONSTRAINT CK_tbl_Expenses_Amount CHECK (Amount > 0),
    BillDate        DATE NOT NULL,
    PaidBy          NVARCHAR(100) NOT NULL CONSTRAINT DF_tbl_Expenses_PaidBy DEFAULT ('Room Pool'),
    PaidByMemberId  INT NULL CONSTRAINT FK_tbl_Expenses_tbl_Roommates FOREIGN KEY REFERENCES dbo.tbl_Roommates(MemberId),
    ReceiptNo       NVARCHAR(100) NULL,
    Notes           NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_Expenses_CreatedAt DEFAULT (SYSDATETIME())
);
GO

-- 4. MEMBER PAYMENTS TABLE (Calculated Share, Paid, Due per roommate per month)
PRINT '>> Creating Table: tbl_MemberPayments (5. Payment Screen Dues)...';
CREATE TABLE dbo.tbl_MemberPayments (
    PaymentId        INT IDENTITY(1,1) PRIMARY KEY,
    MemberId         INT NOT NULL CONSTRAINT FK_tbl_MemberPayments_tbl_Roommates FOREIGN KEY REFERENCES dbo.tbl_Roommates(MemberId) ON DELETE CASCADE,
    RoomId           INT NOT NULL CONSTRAINT FK_tbl_MemberPayments_tbl_Rooms FOREIGN KEY REFERENCES dbo.tbl_Rooms(RoomId),
    BillingMonth     CHAR(7) NOT NULL,
    DaysStayed       INT NOT NULL CONSTRAINT DF_tbl_MemberPayments_DaysStayed DEFAULT (0),
    TotalRoomDays    INT NOT NULL CONSTRAINT DF_tbl_MemberPayments_TotalRoomDays DEFAULT (0),
    CalculatedShare  DECIMAL(18, 2) NOT NULL CONSTRAINT DF_tbl_MemberPayments_CalculatedShare DEFAULT (0),
    PaidAmount       DECIMAL(18, 2) NOT NULL CONSTRAINT DF_tbl_MemberPayments_PaidAmount DEFAULT (0),
    DueAmount        AS (CASE WHEN CalculatedShare - PaidAmount < 0 THEN 0.00 ELSE CalculatedShare - PaidAmount END) PERSISTED,
    Status           NVARCHAR(20) NOT NULL CONSTRAINT DF_tbl_MemberPayments_Status DEFAULT ('Due')
                     CONSTRAINT CK_tbl_MemberPayments_Status CHECK (Status IN ('Paid', 'Partial', 'Due', 'Overdue')),
    DueDate          DATE NULL,
    UpiId            NVARCHAR(100) NULL,
    UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_MemberPayments_UpdatedAt DEFAULT (SYSDATETIME()),
    CONSTRAINT UQ_tbl_MemberPayments_Member_Month UNIQUE (MemberId, BillingMonth)
);
GO

-- 5. PAYMENT TRANSACTIONS TABLE (Detailed UPI / Cash payment audit trail)
PRINT '>> Creating Table: tbl_PaymentTransactions (Transaction Ledger)...';
CREATE TABLE dbo.tbl_PaymentTransactions (
    TransactionId    INT IDENTITY(1,1) PRIMARY KEY,
    PaymentId        INT NOT NULL CONSTRAINT FK_tbl_PaymentTransactions_tbl_MemberPayments FOREIGN KEY REFERENCES dbo.tbl_MemberPayments(PaymentId) ON DELETE CASCADE,
    PaymentDate      DATE NOT NULL CONSTRAINT DF_tbl_PaymentTransactions_PaymentDate DEFAULT (CAST(SYSDATETIME() AS DATE)),
    Amount           DECIMAL(18, 2) NOT NULL CONSTRAINT CK_tbl_PaymentTransactions_Amount CHECK (Amount > 0),
    PaymentMode      NVARCHAR(50) NOT NULL
                     CONSTRAINT CK_tbl_PaymentTransactions_Mode CHECK (PaymentMode IN ('UPI', 'Cash', 'NetBanking', 'Card')),
    ReferenceNo      NVARCHAR(100) NULL,
    Notes            NVARCHAR(MAX) NULL,
    RecordedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_tbl_PaymentTransactions_RecordedAt DEFAULT (SYSDATETIME())
);
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 4: INDEXES FOR QUERY OPTIMIZATION
-- -------------------------------------------------------------------------------------------------
PRINT '>> Creating Performance Indexes...';
CREATE NONCLUSTERED INDEX IX_tbl_Roommates_RoomId_Status ON dbo.tbl_Roommates (RoomId, Status) INCLUDE (MemberName, JoinDate, LeaveDate);
CREATE NONCLUSTERED INDEX IX_tbl_Expenses_RoomId_BillingMonth ON dbo.tbl_Expenses (RoomId, BillingMonth) INCLUDE (Category, Amount);
CREATE NONCLUSTERED INDEX IX_tbl_MemberPayments_BillingMonth_Status ON dbo.tbl_MemberPayments (BillingMonth, Status) INCLUDE (MemberId, CalculatedShare, PaidAmount, DueAmount);
CREATE NONCLUSTERED INDEX IX_tbl_PaymentTransactions_PaymentId ON dbo.tbl_PaymentTransactions (PaymentId) INCLUDE (PaymentDate, Amount, PaymentMode);
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 5: USER-DEFINED FUNCTIONS (MATHEMATICAL PRORATING ENGINE)
-- -------------------------------------------------------------------------------------------------

-- Function to calculate exact active occupancy days for a roommate in any given calendar month
PRINT '>> Creating Scalar Function: dbo.fn_GetDaysOccupiedInMonth...';
GO
CREATE FUNCTION dbo.fn_GetDaysOccupiedInMonth (
    @JoinDate DATE,
    @LeaveDate DATE,
    @BillingMonth CHAR(7) -- 'YYYY-MM' e.g. '2026-06'
)
RETURNS INT
AS
BEGIN
    DECLARE @Year INT = CAST(SUBSTRING(@BillingMonth, 1, 4) AS INT);
    DECLARE @Month INT = CAST(SUBSTRING(@BillingMonth, 6, 2) AS INT);

    DECLARE @MonthStart DATE = DATEFROMPARTS(@Year, @Month, 1);
    DECLARE @MonthEnd DATE = EOMONTH(@MonthStart);

    -- If joined after this month ends, or left before this month begins -> 0 days
    IF (@JoinDate > @MonthEnd) RETURN 0;
    IF (@LeaveDate IS NOT NULL AND @LeaveDate < @MonthStart) RETURN 0;

    -- Determine effective overlap start and end dates
    DECLARE @EffectiveStart DATE = CASE WHEN @JoinDate < @MonthStart THEN @MonthStart ELSE @JoinDate END;
    DECLARE @EffectiveEnd DATE = CASE 
        WHEN @LeaveDate IS NULL OR @LeaveDate > @MonthEnd THEN @MonthEnd 
        ELSE @LeaveDate 
    END;

    DECLARE @Days INT = DATEDIFF(DAY, @EffectiveStart, @EffectiveEnd) + 1;
    RETURN CASE WHEN @Days < 0 THEN 0 ELSE @Days END;
END;
GO

-- Inline Table-Valued Function to calculate the complete dynamic cost split breakdown
PRINT '>> Creating Table-Valued Function: dbo.tvf_CalculateRoommateDynamicSplit...';
GO
CREATE FUNCTION dbo.tvf_CalculateRoommateDynamicSplit (
    @RoomId INT,
    @BillingMonth CHAR(7),
    @SplitMode NVARCHAR(20) = 'prorated' -- 'prorated' OR 'equal'
)
RETURNS TABLE
AS
RETURN
(
    WITH RoomExpenseCTE AS (
        SELECT 
            ISNULL(SUM(Amount), 0.00) AS TotalExpense
        FROM dbo.tbl_Expenses
        WHERE RoomId = @RoomId AND BillingMonth = @BillingMonth
    ),
    RoommateDaysCTE AS (
        SELECT 
            m.MemberId,
            m.MemberCode,
            m.MemberName,
            m.RoomId,
            r.RoomNo,
            m.JoinDate,
            m.LeaveDate,
            m.Status,
            m.UpiId,
            dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, @BillingMonth) AS DaysStayed,
            DAY(EOMONTH(DATEFROMPARTS(CAST(SUBSTRING(@BillingMonth,1,4) AS INT), CAST(SUBSTRING(@BillingMonth,6,2) AS INT), 1))) AS MonthTotalDays
        FROM dbo.tbl_Roommates m
        INNER JOIN dbo.tbl_Rooms r ON m.RoomId = r.RoomId
        WHERE m.RoomId = @RoomId
    ),
    ActiveEligibleCTE AS (
        SELECT 
            c.*,
            SUM(c.DaysStayed) OVER () AS TotalRoomOccupiedDays,
            COUNT(CASE WHEN c.DaysStayed > 0 THEN 1 END) OVER () AS ActiveRoommatesCount
        FROM RoommateDaysCTE c
        WHERE c.DaysStayed > 0
    )
    SELECT 
        a.MemberId,
        a.MemberCode,
        a.MemberName,
        a.RoomId,
        a.RoomNo,
        @BillingMonth AS BillingMonth,
        a.JoinDate,
        a.LeaveDate,
        a.Status,
        a.UpiId,
        a.DaysStayed,
        a.MonthTotalDays,
        a.TotalRoomOccupiedDays,
        a.ActiveRoommatesCount,
        e.TotalExpense,
        CASE 
            WHEN a.TotalRoomOccupiedDays > 0 THEN ROUND(e.TotalExpense / a.TotalRoomOccupiedDays, 4)
            ELSE 0.0000 
        END AS DayRate,
        CASE 
            WHEN @SplitMode = 'equal' AND a.ActiveRoommatesCount > 0 
                THEN ROUND(e.TotalExpense / a.ActiveRoommatesCount, 2)
            WHEN @SplitMode = 'prorated' AND a.TotalRoomOccupiedDays > 0 
                THEN ROUND((e.TotalExpense / CAST(a.TotalRoomOccupiedDays AS DECIMAL(18,4))) * a.DaysStayed, 2)
            ELSE 0.00 
        END AS CalculatedShare,
        CASE 
            WHEN a.ActiveRoommatesCount > 0 THEN ROUND(e.TotalExpense / a.ActiveRoommatesCount, 2)
            ELSE 0.00 
        END AS FlatEqualShare,
        CASE 
            WHEN @SplitMode = 'prorated' 
                THEN CONCAT('(₹', FORMAT(e.TotalExpense, 'N0'), ' / ', a.TotalRoomOccupiedDays, ' days) × ', a.DaysStayed, ' days')
            ELSE CONCAT('₹', FORMAT(e.TotalExpense, 'N0'), ' / ', a.ActiveRoommatesCount, ' roommates')
        END AS FormulaExplanation
    FROM ActiveEligibleCTE a
    CROSS JOIN RoomExpenseCTE e
);
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 6: TRIGGERS FOR AUTOMATED CAPACITY & PAYMENT BALANCING
-- -------------------------------------------------------------------------------------------------

-- Trigger 1: Auto-update Room Cot Occupancy and Full/Available Status
PRINT '>> Creating Trigger: dbo.trg_Roommates_UpdateRoomOccupancy...';
GO
CREATE TRIGGER dbo.trg_Roommates_UpdateRoomOccupancy
ON dbo.tbl_Roommates
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Collect all affected RoomIds
    DECLARE @AffectedRooms TABLE (RoomId INT PRIMARY KEY);
    INSERT INTO @AffectedRooms (RoomId)
    SELECT DISTINCT RoomId FROM inserted
    UNION
    SELECT DISTINCT RoomId FROM deleted;

    -- Update CurrentMembers and Status in tbl_Rooms
    UPDATE r
    SET 
        r.CurrentMembers = ISNULL(sub.ActiveCount, 0),
        r.Status = CASE 
            WHEN r.Status = 'Maintenance' THEN 'Maintenance'
            WHEN ISNULL(sub.ActiveCount, 0) >= r.MaxCapacity THEN 'Full'
            ELSE 'Available'
        END,
        r.UpdatedAt = SYSDATETIME()
    FROM dbo.tbl_Rooms r
    INNER JOIN @AffectedRooms a ON r.RoomId = a.RoomId
    LEFT JOIN (
        SELECT RoomId, COUNT(*) AS ActiveCount
        FROM dbo.tbl_Roommates
        WHERE Status = 'Active'
        GROUP BY RoomId
    ) sub ON r.RoomId = sub.RoomId;
END;
GO

-- Trigger 2: Auto-recalculate Payment PaidAmount and Status when transactions are recorded
PRINT '>> Creating Trigger: dbo.trg_PaymentTransactions_UpdatePaymentStatus...';
GO
CREATE TRIGGER dbo.trg_PaymentTransactions_UpdatePaymentStatus
ON dbo.tbl_PaymentTransactions
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @AffectedPayments TABLE (PaymentId INT PRIMARY KEY);
    INSERT INTO @AffectedPayments (PaymentId)
    SELECT DISTINCT PaymentId FROM inserted
    UNION
    SELECT DISTINCT PaymentId FROM deleted;

    -- Recalculate PaidAmount and Update Status on tbl_MemberPayments
    UPDATE p
    SET 
        p.PaidAmount = ISNULL(t.TotalPaid, 0.00),
        p.Status = CASE 
            WHEN ISNULL(t.TotalPaid, 0.00) >= p.CalculatedShare AND p.CalculatedShare > 0 THEN 'Paid'
            WHEN ISNULL(t.TotalPaid, 0.00) > 0 THEN 'Partial'
            ELSE 'Due'
        END,
        p.UpdatedAt = SYSDATETIME()
    FROM dbo.tbl_MemberPayments p
    INNER JOIN @AffectedPayments a ON p.PaymentId = a.PaymentId
    LEFT JOIN (
        SELECT PaymentId, SUM(Amount) AS TotalPaid
        FROM dbo.tbl_PaymentTransactions
        GROUP BY PaymentId
    ) t ON p.PaymentId = t.PaymentId;
END;
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 7: STORED PROCEDURES (BUSINESS WORKFLOWS)
-- -------------------------------------------------------------------------------------------------

-- Stored Procedure 1: Allocate Roommate to Room (with capacity verification)
PRINT '>> Creating Stored Procedure: dbo.usp_AllocateRoommate...';
GO
CREATE PROCEDURE dbo.usp_AllocateRoommate
    @RoomNo NVARCHAR(50),
    @MemberName NVARCHAR(100),
    @Phone NVARCHAR(25),
    @Email NVARCHAR(150) = NULL,
    @JoinDate DATE,
    @CollegeOrCompany NVARCHAR(150) = NULL,
    @Hometown NVARCHAR(100) = NULL,
    @UpiId NVARCHAR(100) = NULL,
    @DepositPaid DECIMAL(18, 2) = 0.00,
    @EmergencyContact NVARCHAR(150) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @NewMemberId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @RoomId INT, @MaxCapacity INT, @CurrentMembers INT;
        SELECT 
            @RoomId = RoomId, 
            @MaxCapacity = MaxCapacity, 
            @CurrentMembers = CurrentMembers
        FROM dbo.tbl_Rooms 
        WHERE RoomNo = @RoomNo;

        IF @RoomId IS NULL
        BEGIN
            RAISERROR('Error: Bachelor Room %s does not exist.', 16, 1, @RoomNo);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @CurrentMembers >= @MaxCapacity
        BEGIN
            RAISERROR('Error: Room %s is already at full capacity (%d/%d beds occupied).', 16, 1, @RoomNo, @CurrentMembers, @MaxCapacity);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @NextCode NVARCHAR(50) = CONCAT('BR-', CAST(ISNULL((SELECT MAX(MemberId) FROM dbo.tbl_Roommates), 100) + 1 AS NVARCHAR(20)));

        INSERT INTO dbo.tbl_Roommates (
            MemberCode, RoomId, MemberName, Phone, Email, JoinDate, LeaveDate, Status,
            CollegeOrCompany, Hometown, UpiId, DepositPaid, EmergencyContact, Notes
        )
        VALUES (
            @NextCode, @RoomId, @MemberName, @Phone, @Email, @JoinDate, NULL, 'Active',
            @CollegeOrCompany, @Hometown, @UpiId, @DepositPaid, @EmergencyContact, @Notes
        );

        SET @NewMemberId = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
        PRINT CONCAT('Success: Roommate ', @MemberName, ' allocated to ', @RoomNo, ' (Code: ', @NextCode, ').');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure 2: Vacate Roommate (record leave date, frees cot)
PRINT '>> Creating Stored Procedure: dbo.usp_VacateRoommate...';
GO
CREATE PROCEDURE dbo.usp_VacateRoommate
    @MemberId INT,
    @LeaveDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @JoinDate DATE, @MemberName NVARCHAR(100), @RoomNo NVARCHAR(50);
        SELECT 
            @JoinDate = m.JoinDate, 
            @MemberName = m.MemberName, 
            @RoomNo = r.RoomNo
        FROM dbo.tbl_Roommates m
        INNER JOIN dbo.tbl_Rooms r ON m.RoomId = r.RoomId
        WHERE m.MemberId = @MemberId;

        IF @JoinDate IS NULL
        BEGIN
            RAISERROR('Error: Roommate ID %d not found.', 16, 1, @MemberId);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @LeaveDate < @JoinDate
        BEGIN
            RAISERROR('Error: Vacate date cannot be earlier than joining date (%s).', 16, 1, @JoinDate);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE dbo.tbl_Roommates
        SET 
            LeaveDate = @LeaveDate,
            Status = 'Vacated'
        WHERE MemberId = @MemberId;

        COMMIT TRANSACTION;
        PRINT CONCAT('Success: Roommate ', @MemberName, ' marked as Vacated on ', CAST(@LeaveDate AS NVARCHAR(20)), '. Cot in ', @RoomNo, ' is now freed.');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure 3: Add Room Monthly Expense
PRINT '>> Creating Stored Procedure: dbo.usp_AddExpense...';
GO
CREATE PROCEDURE dbo.usp_AddExpense
    @RoomNo NVARCHAR(50),
    @BillingMonth CHAR(7),
    @Category NVARCHAR(50),
    @Title NVARCHAR(200),
    @Amount DECIMAL(18, 2),
    @BillDate DATE,
    @PaidBy NVARCHAR(100) = 'Room Pool',
    @ReceiptNo NVARCHAR(100) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @NewExpenseId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RoomId INT = (SELECT RoomId FROM dbo.tbl_Rooms WHERE RoomNo = @RoomNo);
    IF @RoomId IS NULL
    BEGIN
        RAISERROR('Error: Room %s not found.', 16, 1, @RoomNo);
        RETURN;
    END

    INSERT INTO dbo.tbl_Expenses (
        RoomId, BillingMonth, Category, Title, Amount, BillDate, PaidBy, ReceiptNo, Notes
    )
    VALUES (
        @RoomId, @BillingMonth, @Category, @Title, @Amount, @BillDate, @PaidBy, @ReceiptNo, @Notes
    );

    SET @NewExpenseId = SCOPE_IDENTITY();
    PRINT CONCAT('Success: Added expense ₹', FORMAT(@Amount, 'N2'), ' [', @Category, '] for ', @RoomNo, '.');
END;
GO

-- Stored Procedure 4: Dynamic Cost Split Engine & Payment Synchronization
PRINT '>> Creating Stored Procedure: dbo.usp_GenerateAndSyncMonthlySplit...';
GO
CREATE PROCEDURE dbo.usp_GenerateAndSyncMonthlySplit
    @RoomNo NVARCHAR(50),
    @BillingMonth CHAR(7),
    @SplitMode NVARCHAR(20) = 'prorated' -- 'prorated' OR 'equal'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @RoomId INT = (SELECT RoomId FROM dbo.tbl_Rooms WHERE RoomNo = @RoomNo);
        IF @RoomId IS NULL
        BEGIN
            RAISERROR('Error: Room %s not found.', 16, 1, @RoomNo);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Merge calculated shares into tbl_MemberPayments
        MERGE dbo.tbl_MemberPayments AS target
        USING (
            SELECT 
                MemberId,
                RoomId,
                BillingMonth,
                DaysStayed,
                TotalRoomOccupiedDays,
                CalculatedShare,
                UpiId
            FROM dbo.tvf_CalculateRoommateDynamicSplit(@RoomId, @BillingMonth, @SplitMode)
        ) AS source
        ON (target.MemberId = source.MemberId AND target.BillingMonth = source.BillingMonth)
        WHEN MATCHED THEN
            UPDATE SET 
                target.DaysStayed = source.DaysStayed,
                target.TotalRoomDays = source.TotalRoomOccupiedDays,
                target.CalculatedShare = source.CalculatedShare,
                target.UpiId = ISNULL(source.UpiId, target.UpiId),
                target.Status = CASE 
                    WHEN target.PaidAmount >= source.CalculatedShare AND source.CalculatedShare > 0 THEN 'Paid'
                    WHEN target.PaidAmount > 0 THEN 'Partial'
                    ELSE 'Due'
                END,
                target.UpdatedAt = SYSDATETIME()
        WHEN NOT MATCHED THEN
            INSERT (
                MemberId, RoomId, BillingMonth, DaysStayed, TotalRoomDays,
                CalculatedShare, PaidAmount, Status, DueDate, UpiId, UpdatedAt
            )
            VALUES (
                source.MemberId, source.RoomId, source.BillingMonth, source.DaysStayed, source.TotalRoomOccupiedDays,
                source.CalculatedShare, 0.00, 'Due', DATEFROMPARTS(CAST(SUBSTRING(source.BillingMonth,1,4) AS INT), CAST(SUBSTRING(source.BillingMonth,6,2) AS INT), 25),
                source.UpiId, SYSDATETIME()
            );

        COMMIT TRANSACTION;
        PRINT CONCAT('Success: Synchronized dynamic cost split dues for ', @RoomNo, ' (Month: ', @BillingMonth, ').');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure 5: Record Roommate Payment / UPI Settlement
PRINT '>> Creating Stored Procedure: dbo.usp_RecordRoommatePayment...';
GO
CREATE PROCEDURE dbo.usp_RecordRoommatePayment
    @MemberId INT,
    @BillingMonth CHAR(7),
    @Amount DECIMAL(18, 2),
    @PaymentMode NVARCHAR(50) = 'UPI',
    @ReferenceNo NVARCHAR(100) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @NewTransactionId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PaymentId INT;
        SELECT @PaymentId = PaymentId 
        FROM dbo.tbl_MemberPayments 
        WHERE MemberId = @MemberId AND BillingMonth = @BillingMonth;

        IF @PaymentId IS NULL
        BEGIN
            RAISERROR('Error: No payment due record found for Member %d in month %s. Run split generation first.', 16, 1, @MemberId, @BillingMonth);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO dbo.tbl_PaymentTransactions (
            PaymentId, PaymentDate, Amount, PaymentMode, ReferenceNo, Notes
        )
        VALUES (
            @PaymentId, CAST(SYSDATETIME() AS DATE), @Amount, @PaymentMode, 
            ISNULL(@ReferenceNo, CONCAT('UPI-', CAST(DATEDIFF(SECOND, '2026-01-01', SYSDATETIME()) AS NVARCHAR(20)))),
            @Notes
        );

        SET @NewTransactionId = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
        PRINT CONCAT('Success: Recorded payment of ₹', FORMAT(@Amount, 'N2'), ' for Member ID ', @MemberId, '.');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Stored Procedure 6: Retrieve Full Split Breakdown for a Month
PRINT '>> Creating Stored Procedure: dbo.usp_GetRoommateMonthlySplitSummary...';
GO
CREATE PROCEDURE dbo.usp_GetRoommateMonthlySplitSummary
    @RoomNo NVARCHAR(50),
    @BillingMonth CHAR(7),
    @SplitMode NVARCHAR(20) = 'prorated'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RoomId INT = (SELECT RoomId FROM dbo.tbl_Rooms WHERE RoomNo = @RoomNo);

    -- 1. High-level Summary
    SELECT 
        r.RoomNo,
        r.RoomName,
        @BillingMonth AS BillingMonth,
        ISNULL(SUM(e.Amount), 0.00) AS TotalRoomExpense,
        COUNT(DISTINCT m.MemberId) AS ActiveRoommatesCount,
        ISNULL(SUM(dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, @BillingMonth)), 0) AS TotalOccupiedDays,
        CASE 
            WHEN ISNULL(SUM(dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, @BillingMonth)), 0) > 0 
                THEN ROUND(ISNULL(SUM(e.Amount), 0.00) / SUM(dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, @BillingMonth)), 2)
            ELSE 0.00 
        END AS DayRate
    FROM dbo.tbl_Rooms r
    LEFT JOIN dbo.tbl_Expenses e ON r.RoomId = e.RoomId AND e.BillingMonth = @BillingMonth
    LEFT JOIN dbo.tbl_Roommates m ON r.RoomId = m.RoomId AND dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, @BillingMonth) > 0
    WHERE r.RoomId = @RoomId
    GROUP BY r.RoomNo, r.RoomName;

    -- 2. Member Itemized Split Breakdown
    SELECT * 
    FROM dbo.tvf_CalculateRoommateDynamicSplit(@RoomId, @BillingMonth, @SplitMode)
    ORDER BY MemberName ASC;
END;
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 8: VIEWS FOR REPORTING & ANALYTICS (6. REPORTS)
-- -------------------------------------------------------------------------------------------------

-- Report View 1: Cot Occupancy Report
PRINT '>> Creating View: dbo.vw_RoomCotOccupancyReport (Report 1)...';
GO
CREATE VIEW dbo.vw_RoomCotOccupancyReport
AS
SELECT 
    r.RoomId,
    r.RoomNo,
    r.RoomName,
    r.MaxCapacity,
    r.CurrentMembers,
    CASE WHEN r.MaxCapacity - r.CurrentMembers < 0 THEN 0 ELSE r.MaxCapacity - r.CurrentMembers END AS VacantCots,
    CAST(ROUND((CAST(r.CurrentMembers AS DECIMAL(18,2)) / NULLIF(r.MaxCapacity, 0)) * 100, 1) AS DECIMAL(5,1)) AS OccupancyRatePercent,
    r.BaseRent,
    r.DepositAmount,
    r.Status,
    r.Floor,
    (
        SELECT STRING_AGG(m.MemberName, ', ')
        FROM dbo.tbl_Roommates m
        WHERE m.RoomId = r.RoomId AND m.Status = 'Active'
    ) AS ActiveRoommatesList
FROM dbo.tbl_Rooms r;
GO

-- Report View 2: Monthly Cost Report (Pivoted / Itemized Bills)
PRINT '>> Creating View: dbo.vw_MonthlyCostReport (Report 2)...';
GO
CREATE VIEW dbo.vw_MonthlyCostReport
AS
SELECT 
    r.RoomNo,
    r.RoomName,
    e.BillingMonth,
    ISNULL(SUM(CASE WHEN e.Category = 'Rent' THEN e.Amount ELSE 0 END), 0.00) AS RentExpense,
    ISNULL(SUM(CASE WHEN e.Category = 'Electricity' THEN e.Amount ELSE 0 END), 0.00) AS ElectricityExpense,
    ISNULL(SUM(CASE WHEN e.Category = 'Water' THEN e.Amount ELSE 0 END), 0.00) AS WaterExpense,
    ISNULL(SUM(CASE WHEN e.Category = 'Internet' THEN e.Amount ELSE 0 END), 0.00) AS InternetExpense,
    ISNULL(SUM(CASE WHEN e.Category = 'Cleaning' THEN e.Amount ELSE 0 END), 0.00) AS CleaningExpense,
    ISNULL(SUM(CASE WHEN e.Category = 'Other' THEN e.Amount ELSE 0 END), 0.00) AS OtherExpense,
    ISNULL(SUM(e.Amount), 0.00) AS TotalMonthlyBills,
    COUNT(DISTINCT m.MemberId) AS ActiveRoommatesCount,
    CASE 
        WHEN COUNT(DISTINCT m.MemberId) > 0 THEN ROUND(ISNULL(SUM(e.Amount), 0.00) / COUNT(DISTINCT m.MemberId), 2)
        ELSE 0.00 
    END AS AvgCostPerRoommate
FROM dbo.tbl_Rooms r
INNER JOIN dbo.tbl_Expenses e ON r.RoomId = e.RoomId
LEFT JOIN dbo.tbl_Roommates m ON r.RoomId = m.RoomId AND dbo.fn_GetDaysOccupiedInMonth(m.JoinDate, m.LeaveDate, e.BillingMonth) > 0
GROUP BY r.RoomNo, r.RoomName, e.BillingMonth;
GO

-- Report View 3: Member Due Report (Pending balances & WhatsApp reminder text)
PRINT '>> Creating View: dbo.vw_MemberDueReport (Report 3)...';
GO
CREATE VIEW dbo.vw_MemberDueReport
AS
SELECT 
    p.PaymentId,
    m.MemberId,
    m.MemberCode,
    m.MemberName,
    r.RoomNo,
    p.BillingMonth,
    m.Phone,
    m.UpiId,
    p.DaysStayed,
    p.CalculatedShare,
    p.PaidAmount,
    p.DueAmount,
    p.Status AS PaymentStatus,
    p.DueDate,
    (
        SELECT MAX(t.PaymentDate) 
        FROM dbo.tbl_PaymentTransactions t 
        WHERE t.PaymentId = p.PaymentId
    ) AS LastPaymentDate,
    CONCAT(
        'Hi ', m.MemberName, ', gentle reminder from ', r.RoomNo, ' cost split for ', p.BillingMonth, 
        '. Your pending share is ₹', FORMAT(p.DueAmount, 'N2'), 
        '. Please GPay/PhonePe to ', ISNULL(p.UpiId, 'siva@oksbi'), '. Thanks bro!'
    ) AS WhatsAppReminderText
FROM dbo.tbl_MemberPayments p
INNER JOIN dbo.tbl_Roommates m ON p.MemberId = m.MemberId
INNER JOIN dbo.tbl_Rooms r ON p.RoomId = r.RoomId;
GO

-- Report View 4: Vacated Members Report
PRINT '>> Creating View: dbo.vw_VacatedMembersReport (Report 4)...';
GO
CREATE VIEW dbo.vw_VacatedMembersReport
AS
SELECT 
    m.MemberId,
    m.MemberCode,
    m.MemberName,
    r.RoomNo,
    m.JoinDate,
    m.LeaveDate,
    DATEDIFF(DAY, m.JoinDate, ISNULL(m.LeaveDate, CAST(SYSDATETIME() AS DATE))) + 1 AS TotalStayDays,
    m.Phone,
    m.Email,
    m.Hometown,
    m.DepositPaid,
    ISNULL(SUM(p.DueAmount), 0.00) AS TotalPendingDue,
    CASE 
        WHEN ISNULL(SUM(p.DueAmount), 0.00) <= 0.00 THEN 'Settled'
        ELSE 'Pending Dues'
    END AS SettlementStatus
FROM dbo.tbl_Roommates m
INNER JOIN dbo.tbl_Rooms r ON m.RoomId = r.RoomId
LEFT JOIN dbo.tbl_MemberPayments p ON m.MemberId = p.MemberId
WHERE m.Status = 'Vacated'
GROUP BY 
    m.MemberId, m.MemberCode, m.MemberName, r.RoomNo, 
    m.JoinDate, m.LeaveDate, m.Phone, m.Email, m.Hometown, m.DepositPaid;
GO

-- -------------------------------------------------------------------------------------------------
-- STEP 9: SEED REALISTIC BACHELOR ROOM DATA (EXACT USER PROMPT DEMONSTRATION)
-- -------------------------------------------------------------------------------------------------
PRINT '>> Seeding Realistic Bachelor Room Data...';

-- 1. Seed Bachelor Room 101
INSERT INTO dbo.tbl_Rooms (
    RoomNo, RoomName, MaxCapacity, BaseRent, DepositAmount, Status, Floor, Amenities, Notes
)
VALUES (
    N'Room 101', 
    N'Bachelors Haven (Boys Sharing)', 
    3, 
    9000.00, 
    20000.00, 
    N'Available', 
    N'1st Floor', 
    N'["High-Speed Wi-Fi", "Drinking Water Dispenser", "Attached Bathroom", "Balcony with Clothesline", "Geyser"]',
    N'Spacious 3-sharing bachelor flat room with individual cots and study tables.'
);

DECLARE @Room101Id INT = SCOPE_IDENTITY();

-- 2. Seed Bachelor Roommates (Siva, Kumar, Rahul as specified in user prompt)
-- Siva: 01-Jun | - | Active
-- Kumar: 05-Jun | - | Active
-- Rahul: 10-Jun | 20-Jun | Vacated
INSERT INTO dbo.tbl_Roommates (
    MemberCode, RoomId, MemberName, Phone, Email, JoinDate, LeaveDate, Status,
    CollegeOrCompany, Hometown, UpiId, DepositPaid, EmergencyContact, Notes
)
VALUES 
(
    N'BR-101', @Room101Id, N'Siva', N'+91 98765 43210', N'siva@example.com', 
    '2026-06-01', NULL, N'Active', 
    N'Tech Solutions (Software Engineer)', N'Madurai', N'siva@oksbi', 7000.00, N'+91 98765 00001', N'Room coordinator'
),
(
    N'BR-102', @Room101Id, N'Kumar', N'+91 98765 43211', N'kumar@example.com', 
    '2026-06-05', NULL, N'Active', 
    N'Cognizant (QA Engineer)', N'Trichy', N'kumar@paytm', 7000.00, N'+91 98765 00002', N'Shifted on 5th June'
),
(
    N'BR-103', @Room101Id, N'Rahul', N'+91 98765 43212', N'rahul@example.com', 
    '2026-06-10', '2026-06-20', N'Vacated', 
    N'Anna University (Intern)', N'Coimbatore', N'rahul@ybl', 6000.00, N'+91 98765 00003', N'Internship completed on 20-Jun'
);

DECLARE @SivaId INT = (SELECT MemberId FROM dbo.tbl_Roommates WHERE MemberCode = 'BR-101');
DECLARE @KumarId INT = (SELECT MemberId FROM dbo.tbl_Roommates WHERE MemberCode = 'BR-102');
DECLARE @RahulId INT = (SELECT MemberId FROM dbo.tbl_Roommates WHERE MemberCode = 'BR-103');

-- 3. Seed June 2026 Expenses totaling ₹15,000 (Matches prompt exactly)
-- Rent: ₹9000, Electricity: ₹2400, Water: ₹600, Internet: ₹1200, Cleaning: ₹1000, Other: ₹800
INSERT INTO dbo.tbl_Expenses (
    RoomId, BillingMonth, Category, Title, Amount, BillDate, PaidBy, PaidByMemberId, ReceiptNo, Notes
)
VALUES 
(@Room101Id, '2026-06', N'Rent', N'Monthly Room Rent to Landlord', 9000.00, '2026-06-01', N'Room Pool', NULL, N'RENT-JUN-2026', N'Fixed room rent'),
(@Room101Id, '2026-06', N'Electricity', N'EB Power Meter Bill', 2400.00, '2026-06-12', N'Siva', @SivaId, N'EB-618', N'Meter power bill'),
(@Room101Id, '2026-06', N'Water', N'Drinking Water 20L Bubble Cans', 600.00, '2026-06-05', N'Kumar', @KumarId, N'WTR-12', N'12 cans @ 50'),
(@Room101Id, '2026-06', N'Internet', N'Airtel Fiber 200Mbps Wi-Fi', 1200.00, '2026-06-08', N'Siva', @SivaId, N'AIRTEL-491', N'Broadband bill'),
(@Room101Id, '2026-06', N'Cleaning', N'Maid Room Sweeping & Mopping', 1000.00, '2026-06-15', N'Room Pool', NULL, N'MAID-06', N'Cleaning charges'),
(@Room101Id, '2026-06', N'Other', N'Groceries, Vim Bar & Room Liquidator', 800.00, '2026-06-18', N'Kumar', @KumarId, N'ITEMS-88', N'Common supplies');

-- 4. Execute Dynamic Split Calculation & Sync to Member Payments
EXEC dbo.usp_GenerateAndSyncMonthlySplit @RoomNo = N'Room 101', @BillingMonth = '2026-06', @SplitMode = 'prorated';

-- 5. Record Initial Payments (Siva full paid, Kumar partial paid)
DECLARE @DummyTxn INT;
-- Siva pays his full calculated share (₹6,716.42)
EXEC dbo.usp_RecordRoommatePayment 
    @MemberId = @SivaId, 
    @BillingMonth = '2026-06', 
    @Amount = 6716.42, 
    @PaymentMode = N'UPI', 
    @ReferenceNo = N'UPI/617283948/GPay', 
    @Notes = N'Full settlement via Google Pay', 
    @NewTransactionId = @DummyTxn OUTPUT;

-- Kumar pays partial installment (₹4,000.00 out of ₹5,820.90)
EXEC dbo.usp_RecordRoommatePayment 
    @MemberId = @KumarId, 
    @BillingMonth = '2026-06', 
    @Amount = 4000.00, 
    @PaymentMode = N'UPI', 
    @ReferenceNo = N'UPI/981273912/PhonePe', 
    @Notes = N'Part payment via PhonePe, balance ₹1820.90 pending', 
    @NewTransactionId = @DummyTxn OUTPUT;

GO

-- -------------------------------------------------------------------------------------------------
-- STEP 10: VERIFICATION & SAMPLE REPORT EXECUTION
-- -------------------------------------------------------------------------------------------------
PRINT '====================================================================================================';
PRINT ' DATABASE SETUP COMPLETED SUCCESSFULLY! VERIFICATION RESULTS:';
PRINT '====================================================================================================';

PRINT '1. Bachelor Room Master Status:';
SELECT * FROM dbo.vw_RoomCotOccupancyReport;

PRINT '2. June 2026 Room Bills Breakdown (Total ₹15,000):';
SELECT * FROM dbo.vw_MonthlyCostReport;

PRINT '3. Dynamic Prorated Cost Split Results (30 days Siva, 26 days Kumar, 11 days Rahul):';
EXEC dbo.usp_GetRoommateMonthlySplitSummary @RoomNo = N'Room 101', @BillingMonth = '2026-06', @SplitMode = 'prorated';

PRINT '4. Roommate Dues & Settlement Status:';
SELECT * FROM dbo.vw_MemberDueReport;

PRINT '5. Vacated Roommates Log:';
SELECT * FROM dbo.vw_VacatedMembersReport;
GO
