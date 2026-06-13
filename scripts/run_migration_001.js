const { Pool } = require("pg")
const dotenv = require("dotenv")
const fs = require("fs")
const path = require("path")

dotenv.config({ path: ".env.local" })

async function main() {
  const sqlPath = path.join(__dirname, "migrations", "001_nextauth_schema.sql")
  const sqlText = fs.readFileSync(sqlPath, "utf8")

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    console.error(
      "Missing POSTGRES_URL (or DATABASE_URL) in env. Did .env.local load?",
    )
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  console.log("Running migration 001 (single batch via pg simple query)...")
  try {
    await pool.query(sqlText)
    console.log("Migration 001 complete.")
  } catch (err) {
    console.error("Migration 001 failed:", err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
