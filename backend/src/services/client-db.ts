/**
 * client-db.ts — Multi-driver query runner para la DB del cliente
 *
 * Soporta: SQL Server, PostgreSQL, MySQL, MariaDB
 * Configuración via env vars CLIENT_DB_*
 *
 * La DB del cliente es independiente de la DB de CloverBI (que siempre es SQL Server).
 * Esta conexión es la que se usa para ejecutar las queries de los dashboards.
 */

import mssql from 'mssql'
import pg from 'pg'
import mysql from 'mysql2/promise'

export type DbType = 'mssql' | 'postgresql' | 'mysql' | 'mariadb'

export interface ClientDbConfig {
  type: DbType
  host: string
  port: number
  user: string
  password: string
  database: string
}

function getClientDbConfig(): ClientDbConfig {
  const type = (process.env.CLIENT_DB_TYPE || 'mssql') as DbType
  const host = process.env.CLIENT_DB_HOST || ''
  const port = parseInt(process.env.CLIENT_DB_PORT || '1433')
  const user = process.env.CLIENT_DB_USER || ''
  const password = process.env.CLIENT_DB_PASS || ''
  const database = process.env.CLIENT_DB_NAME || ''

  if (!host || !user || !database) {
    throw new Error(
      'CLIENT_DB_HOST, CLIENT_DB_USER y CLIENT_DB_NAME son requeridos. ' +
      'Verificá las variables de entorno del backend.'
    )
  }

  return { type, host, port, user, password, database }
}

// ============================================================
// MSSQL
// ============================================================

let mssqlPool: mssql.ConnectionPool | null = null

async function queryMssql(sqlQuery: string): Promise<any[]> {
  const cfg = getClientDbConfig()

  if (!mssqlPool) {
    mssqlPool = await mssql.connect({
      server: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    })
    console.log('🗄️ Client DB connected (mssql)')
  }

  const result = await mssqlPool.request().query(sqlQuery)
  return result.recordset
}

// ============================================================
// PostgreSQL
// ============================================================

let pgPool: pg.Pool | null = null

async function queryPostgres(sqlQuery: string): Promise<any[]> {
  const cfg = getClientDbConfig()

  if (!pgPool) {
    pgPool = new pg.Pool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      max: 5,
      idleTimeoutMillis: 30000,
      ssl: false,
    })
    console.log('🗄️ Client DB connected (postgresql)')
  }

  const result = await pgPool.query(sqlQuery)
  return result.rows
}

// ============================================================
// MySQL / MariaDB
// ============================================================

let mysqlPool: mysql.Pool | null = null

async function queryMysql(sqlQuery: string): Promise<any[]> {
  const cfg = getClientDbConfig()

  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      connectionLimit: 5,
    })
    console.log('🗄️ Client DB connected (mysql/mariadb)')
  }

  const [rows] = await mysqlPool.execute(sqlQuery)
  return rows as any[]
}

// ============================================================
// API pública
// ============================================================

/**
 * Ejecuta una query contra la DB del cliente.
 * El tipo de DB se determina por CLIENT_DB_TYPE.
 */
export async function clientQuery(sqlQuery: string): Promise<any[]> {
  const cfg = getClientDbConfig()

  switch (cfg.type) {
    case 'mssql':
      return queryMssql(sqlQuery)

    case 'postgresql':
      return queryPostgres(sqlQuery)

    case 'mysql':
    case 'mariadb':
      return queryMysql(sqlQuery)

    default:
      throw new Error(`Tipo de DB no soportado: ${cfg.type}. Usá: mssql | postgresql | mysql | mariadb`)
  }
}

/**
 * Resetea los pools (útil para tests o reconexión forzada)
 */
export async function resetClientDb(): Promise<void> {
  if (mssqlPool) { await mssqlPool.close(); mssqlPool = null }
  if (pgPool) { await pgPool.end(); pgPool = null }
  if (mysqlPool) { await mysqlPool.end(); mysqlPool = null }
}

/**
 * Verifica si la config de CLIENT_DB está presente
 */
export function hasClientDbConfig(): boolean {
  return !!(
    process.env.CLIENT_DB_HOST &&
    process.env.CLIENT_DB_USER &&
    process.env.CLIENT_DB_NAME
  )
}
