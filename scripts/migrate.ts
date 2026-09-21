import { closeDbForTests, getDb } from "../lib/db.ts";

getDb();
console.log("Kondo Ninja database is ready.");
closeDbForTests();
