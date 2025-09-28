
import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://app.arzansite.com/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6898b35e003067cd7b43';

if (!endpoint || !projectId) {
  console.error('Appwrite environment variables (VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID) are not set!');
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

export { client, account, database, storage };
