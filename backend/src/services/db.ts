import sql from "mssql"

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT || "2433"),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config)
    console.log("🗄️ Connected to CloverBI database")
  }
  return pool
}

export async function query<T>(sqlQuery: string, params?: Record<string, any>): Promise<T[]> {
  const p = await getPool()
  const request = p.request()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  const result = await request.query(sqlQuery)
  return result.recordset as T[]
}

export async function execute(sqlQuery: string, params?: Record<string, any>): Promise<number> {
  const p = await getPool()
  const request = p.request()

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value)
    }
  }

  const result = await request.query(sqlQuery)
  return result.rowsAffected[0]
}

export { sql }
