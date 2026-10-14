USE NEPSorteosDB;
GO
IF OBJECT_ID('dbo.Users','U') IS NULL
CREATE TABLE Users (
  Id INT IDENTITY PRIMARY KEY,
  FullName NVARCHAR(150) NOT NULL,
  Email NVARCHAR(150) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF COL_LENGTH('Raffles','OwnerId') IS NULL
  ALTER TABLE Raffles ADD OwnerId INT NULL REFERENCES Users(Id);
IF COL_LENGTH('Registrations','UserId') IS NULL
  ALTER TABLE Registrations ADD UserId INT NULL REFERENCES Users(Id);
IF COL_LENGTH('Registrations','PaymentState') IS NULL
  ALTER TABLE Registrations ADD PaymentState VARCHAR(20) NOT NULL CONSTRAINT DF_Registrations_PaymentState DEFAULT 'Retenido';
GO
IF COL_LENGTH('Raffles','SuspendedAt') IS NULL ALTER TABLE Raffles ADD SuspendedAt DATETIME2 NULL;
GO
IF COL_LENGTH('Raffles','ImageData') IS NULL ALTER TABLE Raffles ADD ImageData NVARCHAR(MAX) NULL;
GO


IF COL_LENGTH('Raffles','SuspensionUsed') IS NULL
BEGIN
 ALTER TABLE Raffles ADD SuspensionUsed BIT NOT NULL CONSTRAINT DF_Raffles_SuspensionUsed DEFAULT 0;
 EXEC('UPDATE Raffles SET SuspensionUsed=1,SuspendedAt=COALESCE(SuspendedAt,SYSUTCDATETIME()) WHERE Status=''Suspendido'' OR SuspendedAt IS NOT NULL');
END;
GO
