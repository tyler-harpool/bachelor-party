// CommonJS version for direct node execution
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { pgTable, serial, text } = require('drizzle-orm/pg-core');
require('dotenv').config({ path: '../.env' });

// Create db connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Define schema
const pollTable = {
  option: 'option',
  ipAddress: 'ip_address'
};

async function addTestVotes() {
  try {
    // Add some test votes
    const options = ['Pizza', 'Burgers', 'Tacos', 'Sushi'];
    
    for (let i = 0; i < 10; i++) {
      const randomOption = options[Math.floor(Math.random() * options.length)];
      const randomIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
      
      await db.insert('votes').values({
        [pollTable.option]: randomOption,
        [pollTable.ipAddress]: randomIP
      });
      
      console.log(`Added vote for ${randomOption} from ${randomIP}`);
    }
    
    console.log('Test votes added successfully!');
  } catch (error) {
    console.error('Error adding test votes:', error);
  } finally {
    process.exit(0);
  }
}

addTestVotes();