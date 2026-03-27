// Vulnerable: NoSQL injection in MongoDB
const { MongoClient } = require('mongodb');

async function findUser(username, password) {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  const db = client.db('app');
  // Vulnerable: user input passed directly to query operators
  const user = await db.collection('users').findOne({
    username: username,
    password: password
  });
  await client.close();
  return user;
}

async function searchItems(filters) {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  const db = client.db('app');
  // Vulnerable: entire user-controlled object used as query
  const items = await db.collection('items').find(filters).toArray();
  await client.close();
  return items;
}
