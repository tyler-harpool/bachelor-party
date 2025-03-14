import { db } from './drizzle.js';
import { pollTable } from './schema.js';

async function addTestVotes() {
  try {
    // Add some test votes
    const options = ['Pizza', 'Burgers', 'Tacos', 'Sushi'];
    
    for (let i = 0; i < 10; i++) {
      const randomOption = options[Math.floor(Math.random() * options.length)];
      const randomIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
      
      await db.insert(pollTable).values({
        option: randomOption,
        ipAddress: randomIP
      });
      
      console.log(`Added vote for ${randomOption} from ${randomIP}`);
    }
    
    console.log('Test votes added successfully!');
  } catch (error) {
    console.error('Error adding test votes:', error);
  }
}

addTestVotes();