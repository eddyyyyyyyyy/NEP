// El driver msnodesqlv8 usa la sesión de Windows del usuario que ejecuta Node.
// No se envían ni se guardan credenciales de SQL Server.
import sql from 'mssql/msnodesqlv8.js';
import 'dotenv/config';

const server = process.env.DB_SERVER || 'localhost';
const database = process.env.DB_NAME || 'NEPSorteosDB';
const driver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server';

// Cadena ODBC explícita: soporta instancias nombradas, como EQUIPO\\INSTANCIA,
// y usa las credenciales de Windows de la persona que ejecuta el backend.
const config = {
  connectionString: `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=Yes;Encrypt=No;TrustServerCertificate=Yes;`
};

let pool;
export async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}
export { sql };
