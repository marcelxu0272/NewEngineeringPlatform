import { getDb } from './client';
import { SCHEMA_SQL } from './schema';

const db = getDb();
db.exec(SCHEMA_SQL);
console.log('Database schema initialized.');
