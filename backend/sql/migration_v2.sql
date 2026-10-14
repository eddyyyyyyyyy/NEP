USE NEPSorteosDB;
GO
IF COL_LENGTH('Raffles','EndingMode') IS NULL
  ALTER TABLE Raffles ADD EndingMode VARCHAR(20) NOT NULL CONSTRAINT DF_Raffles_EndingMode DEFAULT 'Boletos';
GO
UPDATE Raffles SET EndingMode='Boletos' WHERE EndingMode IS NULL;
GO
ALTER TABLE Raffles ALTER COLUMN DrawDate DATETIME2 NULL;
ALTER TABLE Raffles ALTER COLUMN MaxTickets INT NULL;
GO
DECLARE @constraint NVARCHAR(128);
DECLARE @sql NVARCHAR(MAX);
SELECT @constraint=dc.name FROM sys.default_constraints dc JOIN sys.columns c ON dc.parent_object_id=c.object_id AND dc.parent_column_id=c.column_id WHERE dc.parent_object_id=OBJECT_ID('dbo.Raffles') AND c.name='Status';
IF @constraint IS NOT NULL
BEGIN
  SET @sql=N'ALTER TABLE dbo.Raffles DROP CONSTRAINT '+QUOTENAME(@constraint);
  EXEC sys.sp_executesql @sql;
END
DECLARE @check NVARCHAR(128);
SELECT @check=cc.name FROM sys.check_constraints cc WHERE cc.parent_object_id=OBJECT_ID('dbo.Raffles') AND cc.definition LIKE '%Status%';
IF @check IS NOT NULL
BEGIN
  SET @sql=N'ALTER TABLE dbo.Raffles DROP CONSTRAINT '+QUOTENAME(@check);
  EXEC sys.sp_executesql @sql;
END
ALTER TABLE dbo.Raffles ADD CONSTRAINT CK_Raffles_Status CHECK(Status IN ('Abierto','Suspendido','Finalizado','Cancelado'));
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('dbo.Raffles') AND name='DF_Raffles_Status')
  ALTER TABLE dbo.Raffles ADD CONSTRAINT DF_Raffles_Status DEFAULT 'Abierto' FOR Status;
GO
