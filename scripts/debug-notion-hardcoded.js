
const { Client } = require('@notionhq/client');
const fs = require('fs');

// Hardcoded for debugging
const NOTION_TOKEN = 'ntn_Y835809862538FWddZ4X2XdYNn1YGHIchSRj3HoJklNaZD';
const NOTION_DATABASE_ID = '3041f22e76c18052acb2d8251fccf542';

const notion = new Client({
    auth: NOTION_TOKEN,
});

async function debugNotion() {
    let log = 'Testing Notion Connection...\n';

    try {
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            page_size: 1,
        });

        if (response.results.length === 0) {
            log += 'No posts found.\n';
            fs.writeFileSync('debug-notion.log', log);
            return;
        }

        const page = response.results[0];

        log += '--- KEYS ---\n';
        Object.keys(page.properties).forEach(key => {
            log += `"${key}" (Type: ${page.properties[key].type})\n`;
        });

        log += '\n--- TITLE PROP ---\n';
        const titleKey = Object.keys(page.properties).find(key => page.properties[key].type === 'title');
        if (titleKey) {
            log += `Found title property with key: "${titleKey}"\n`;
            log += JSON.stringify(page.properties[titleKey], null, 2) + '\n';
        } else {
            log += 'NO TITLE PROPERTY FOUND!\n';
        }

        log += '\n--- CATEGORY PROP ---\n';
        const selectKey = Object.keys(page.properties).find(key => page.properties[key].type === 'select');
        if (selectKey) {
            log += `Found select property with key: "${selectKey}"\n`;
            log += JSON.stringify(page.properties[selectKey], null, 2) + '\n';
        } else {
            log += 'NO SELECT PROPERTY FOUND!\n';
        }

        fs.writeFileSync('debug-notion.log', log);
        console.log('Log written to debug-notion.log');

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('debug-notion.log', 'Error: ' + error.message);
    }
}

debugNotion();
