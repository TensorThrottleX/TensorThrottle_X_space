
const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function debugNotion() {
  console.log('Testing Notion Connection...');
  console.log('Database ID:', DATABASE_ID);

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 1,
    });

    if (response.results.length === 0) {
      console.log('No posts found in database.');
      return;
    }

    const page = response.results[0];
    console.log('--- raw page properties keys ---');
    console.log(Object.keys(page.properties));
    
    console.log('--- full properties object ---');
    console.log(JSON.stringify(page.properties, null, 2));

  } catch (error) {
    console.error('Error fetching from Notion:', error);
  }
}

debugNotion();
