const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://sdzylqidfjunid:FLDP-SOZg43cpRY-s3wwRTn137@ec2-46-137-97-169.eu-west-1.compute.amazonaws.com:5432/d5cquq4ebk7477';

const client = new pg.Client(connectionString);
client.connect();

const query1 = client.query(
  'CREATE TABLE highscores(id SERIAL PRIMARY KEY, name VARCHAR(255) not null, score INTEGER not null, date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW());');
query1.on('end', () => { client.end(); });

const query2 = client.query('CREATE TABLE artists(id SERIAL PRIMARY KEY, uri VARCHAR(255) UNIQUE, name VARCHAR(255), count INTEGER DEFAULT 0);')
query2.on('end', () => { client.end(); });
