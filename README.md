# NEP — Nadie es Pariguayo

Aplicación web académica para organizar rifas con trazabilidad de participantes, boletos pagados y resultados. El pago con tarjeta, los saldos y los reembolsos son simulados: el sistema no procesa dinero real ni guarda datos de tarjeta o CVV.

## Tecnologías

- Frontend: React, Vite y Axios
- Backend: JavaScript, Node.js y Express
- Base de datos: Microsoft SQL Server
- Conexión a base de datos: `mssql`, `msnodesqlv8` y autenticación de Windows

## Requisitos

- Node.js 18 o superior
- Microsoft SQL Server y SQL Server Management Studio
- ODBC Driver 17 for SQL Server
- Una cuenta de Windows con acceso a la instancia y a la base de datos

## Instalación

### 1. Crear la base de datos

Abre SQL Server Management Studio, conéctate a tu instancia de SQL Server y ejecuta:

```text
backend/sql/schema.sql
```

El script crea la base de datos `NEPSorteosDB` y sus tablas iniciales.

### 2. Configurar el backend

Copia `backend/.env.example` como `backend/.env`.

En PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Edita `backend/.env` y reemplaza `DB_SERVER` por el nombre de tu instancia. Ejemplos:

```env
DB_SERVER=localhost
# o
DB_SERVER=EQUIPO\SQLEXPRESS
# o
DB_SERVER=EQUIPO\NOMBRE_INSTANCIA
```

La aplicación usa autenticación de Windows. La cuenta que ejecuta Node.js debe tener acceso a SQL Server.

### 3. Ejecutar el backend

```powershell
cd backend
npm install
npm run dev
```

Debe aparecer:

```text
NEP API disponible en puerto 3000
```

Al iniciar, el backend aplica automáticamente las migraciones necesarias para cuentas, suspensión, chat, testimonios y soporte.

### 4. Ejecutar el frontend

Abre otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente:

```text
http://localhost:5173
```

## Funciones principales

- Registro e inicio de sesión con token Bearer temporal.
- Creación de rifas con cierre por fecha o por cantidad de boletos.
- Pago con tarjeta simulado y asignación consecutiva de boletos.
- Control de inventario y bloqueo de compras cuando se agotan los boletos.
- Suspensión única con contador de siete días y reembolso simulado si vence.
- Finalización manual o automática.
- Selección aleatoria en SQL Server entre boletos pagados.
- Chat privado entre organizador y ganador.
- Testimonios y solicitudes de soporte para NEP.

## Selección del ganador

El backend ejecuta la selección en `backend/src/routes/raffles.js`. La consulta filtra boletos de participantes pagados, los ordena aleatoriamente con `NEWID()` y toma uno con `TOP 1`:

```sql
SELECT TOP 1 t.TicketNumber, r.ParticipantName
FROM Tickets t
JOIN Registrations r ON r.Id = t.RegistrationId
WHERE t.RaffleId = @id AND r.Status = 'Participando'
ORDER BY NEWID();
```

La API guarda el boleto ganador antes de que React muestre la animación.

## Endpoints de referencia

- `GET /api/health`
- `GET /api/raffles`
- `POST /api/raffles`
- `POST /api/raffles/:code/register`
- `POST /api/raffles/registrations/:id/pay`
- `POST /api/account/register`
- `POST /api/account/login`

Con el backend activo, puedes ver la respuesta JSON de rifas en `http://localhost:3000/api/raffles`.

## Notas del prototipo

- El chat consulta nuevos mensajes cada pocos segundos. No utiliza WebSockets.
- El correo de confirmación solo funciona si se configuran datos SMTP en `.env`.
- Las sesiones se mantienen en memoria. Si el backend se reinicia, los usuarios deben iniciar sesión otra vez.
- Mantén el backend encendido para que revise cierres automáticos y plazos de suspensión.
