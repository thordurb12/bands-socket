const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/bands';

const client = new pg.Client(connectionString);
client.connect();
const query = client.query(
  'CREATE TABLE highscores(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, score INTEGER not null)');
query.on('end', () => { client.end(); });
