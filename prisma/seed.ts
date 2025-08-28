import { PrismaClient, Role, GosiType } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "fs"
import path, { dirname } from "path"
import { parse } from "csv-parse/sync"
import { fileURLToPath } from "url"

const prisma = new PrismaClient()

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface EmployeeRow {
  No?: string
  "First Name": string
  "Middle Name"?: string
  "Last Name": string
  "Iqama No Saudi ID"?: string
  Nationality?: string
  "GOSI Type"?: string
  "Job Title"?: string
  "Store Code"?: string
  "Employee ID"?: string
}

async function main() {
  // Clear old data
  await prisma.leaveRequest.deleteMany({})
  await prisma.user.deleteMany({})
  console.log("🌱 Seeding database...")

  // 1. Create Admin
  const adminPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.create({
    data: {
      employeeId: "HCADMIN01",
      firstName: "System",
      lastName: "Administrator",
      email: "admin@company.com",
      password: adminPassword,
      role: Role.ADMIN,
      jobTitle: "System Administrator",
      nationality: "Saudi Arabia",
      gosiType: GosiType.SAUDI,
      storeCode: "HQ001",
    },
  })
  console.log("✅ Admin user created")

  // 2. Create Supervisors
  await prisma.user.createMany({
    data: [
      {
        employeeId: "HCS001",
        firstName: "Kakkiya",
        lastName: "",
        email: "kakkiya@company.com",
        password: await bcrypt.hash("adminS001", 12),
        role: Role.SUPERVISOR,
        jobTitle: "Supervisor",
        nationality: "Saudi",
        gosiType: GosiType.SAUDI,
        storeCode: "S001",
      },
      {
        employeeId: "HCS003",
        firstName: "Jumum",
        lastName: "",
        email: "jumum@company.com",
        password: await bcrypt.hash("adminS003", 12),
        role: Role.SUPERVISOR,
        jobTitle: "Supervisor",
        nationality: "Saudi",
        gosiType: GosiType.SAUDI,
        storeCode: "S003",
      },
      {
        employeeId: "HCHO",
        firstName: "Zahidi",
        lastName: "",
        email: "zahidi@company.com",
        password: await bcrypt.hash("adminHO", 12),
        role: Role.SUPERVISOR,
        jobTitle: "Supervisor",
        nationality: "Saudi",
        gosiType: GosiType.SAUDI,
        storeCode: "HO",
      },
      {
        employeeId: "HCWH",
        firstName: "Jumla",
        lastName: "",
        email: "jumla@company.com",
        password: await bcrypt.hash("adminWH", 12),
        role: Role.SUPERVISOR,
        jobTitle: "Supervisor",
        nationality: "Saudi",
        gosiType: GosiType.SAUDI,
        storeCode: "Wholesale",
      },
    ],
    skipDuplicates: true, // avoid supervisor duplication
  })

  // Fetch supervisors for mapping
  const supervisorMap = await prisma.user.findMany({
    where: { role: Role.SUPERVISOR },
    select: { id: true, storeCode: true },
  })

  const supervisorByStore: Record<string, string> = {}
  for (const sup of supervisorMap) {
    if (sup.storeCode) {
      supervisorByStore[sup.storeCode] = sup.id
    }
  }
  console.log("✅ Supervisors created:", supervisorByStore)

  // 3. Load Employees CSV
  const csvPath = path.join(__dirname, "../data/employees.csv")
  const file = fs.readFileSync(csvPath)
  const records: EmployeeRow[] = parse(file, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    skip_empty_lines: true,
  }) as EmployeeRow[]

  // 4. Insert Employees (using upsert to skip duplicates)
  for (const row of records) {
    const email = `${row["First Name"]?.toLowerCase().trim() || "user"}.${
      row["Last Name"]?.toLowerCase().trim() || "emp"
    }@company.com`

    const password = await bcrypt.hash("password123", 12)
    const employeeId =
      row["Employee ID"]?.trim() || `HC${1000 + Math.floor(Math.random() * 9000)}`
    const supervisorId = row["Store Code"]?.trim()
      ? supervisorByStore[row["Store Code"].trim()] || null
      : null

    await prisma.user.upsert({
      where: { employeeId },
      update: {}, // do nothing if exists
      create: {
        employeeId,
        firstName: row["First Name"]?.trim() || "Unknown",
        middleName: row["Middle Name"]?.trim() || null,
        lastName: row["Last Name"]?.trim() || "Unknown",
        iqamaNo: row["Iqama No Saudi ID"]?.trim() || null,
        nationality: row.Nationality?.trim() || null,
        gosiType:
          row["GOSI Type"]?.toUpperCase().trim() === "SAUDI"
            ? GosiType.SAUDI
            : row["GOSI Type"]?.toUpperCase().trim() === "NON_SAUDI"
            ? GosiType.NON_SAUDI
            : null,
        jobTitle: row["Job Title"]?.trim() || null,
        storeCode: row["Store Code"]?.trim() || null,
        email,
        password,
        role: Role.EMPLOYEE,
        supervisorId,
      },
    })
  }

  console.log(`✅ Imported ${records.length} employees (duplicates skipped)`)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
