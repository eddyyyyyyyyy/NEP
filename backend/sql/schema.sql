IF DB_ID('NEPSorteosDB') IS NULL CREATE DATABASE NEPSorteosDB;
GO
USE NEPSorteosDB;
GO
CREATE TABLE Raffles (
  Id INT IDENTITY PRIMARY KEY, PublicCode VARCHAR(20) NOT NULL UNIQUE, ManageCode VARCHAR(20) NOT NULL,
  Name NVARCHAR(150) NOT NULL, Prize NVARCHAR(150) NOT NULL, Description NVARCHAR(500) NULL,
  DrawDate DATETIME2 NOT NULL, Status VARCHAR(20) NOT NULL DEFAULT 'Abierto' CHECK(Status IN ('Abierto','Finalizado')),
  TicketPrice DECIMAL(10,2) NOT NULL CHECK(TicketPrice > 0), MaxTickets INT NOT NULL CHECK(MaxTickets > 0),
  WinnerTicketNumber INT NULL, DrawnAt DATETIME2 NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE Registrations (
  Id INT IDENTITY PRIMARY KEY, RaffleId INT NOT NULL REFERENCES Raffles(Id), ParticipantName NVARCHAR(150) NOT NULL,
  Email NVARCHAR(150) NOT NULL, TicketCount INT NOT NULL CHECK(TicketCount > 0), TotalAmount DECIMAL(10,2) NOT NULL,
  Status VARCHAR(20) NOT NULL DEFAULT 'Inscrito' CHECK(Status IN ('Inscrito','Participando')),
  TransactionReference VARCHAR(40) NULL, PaidAt DATETIME2 NULL, CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_Registration_Email UNIQUE(RaffleId, Email)
);
CREATE TABLE Tickets (
  Id INT IDENTITY PRIMARY KEY, RaffleId INT NOT NULL REFERENCES Raffles(Id), RegistrationId INT NOT NULL REFERENCES Registrations(Id),
  TicketNumber INT NOT NULL, CONSTRAINT UQ_Ticket_Number UNIQUE(RaffleId, TicketNumber)
);
CREATE INDEX IX_Raffles_PublicCode ON Raffles(PublicCode);
CREATE INDEX IX_Tickets_Raffle ON Tickets(RaffleId);
