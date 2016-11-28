const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/bands';

const client = new pg.Client(connectionString);
client.connect();

const query1 = client.query(
  'CREATE TABLE highscores(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, score INTEGER not null)');
query1.on('end', () => { client.end(); });

const query2 = client.query('CREATE TABLE artists(id SERIAL PRIMARY KEY, uri VARCHAR(255) UNIQUE, name VARCHAR(255), count INTEGER DEFAULT 0);')
query2.on('end', () => { client.end(); });