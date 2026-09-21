import { databasePath, ensureDataDirs, uploadsDir } from "../lib/config.ts";
import { closeDbForTests, getDb } from "../lib/db.ts";

ensureDataDirs();
getDb();
console.log(`Database: ${databasePath}`);
console.log(`Private uploads: ${uploadsDir}`);
closeDbForTests();
