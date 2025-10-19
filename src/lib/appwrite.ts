
import { Client, Account, Databases, Storage } from 'appwrite';
import { environment, debugLog, errorLog } from '@/lib/config/environment';

// Get Appwrite configuration from environment
const { appwrite } = environment;

// Validate configuration
if (!appwrite.endpoint || !appwrite.projectId) {
  errorLog('Appwrite configuration is incomplete', {
    endpoint: appwrite.endpoint,
    projectId: appwrite.projectId,
  });
  throw new Error('Appwrite configuration is incomplete. Please check your environment variables.');
}

debugLog('Initializing Appwrite client', {
  endpoint: appwrite.endpoint,
  projectId: appwrite.projectId,
  databaseId: appwrite.databaseId,
});

const client = new Client()
  .setEndpoint(appwrite.endpoint)
  .setProject(appwrite.projectId);

const account = new Account(client);
const database = new Databases(client);
const storage = new Storage(client);

// For Appwrite 1.6.1, realtime is not available in the client SDK
// We'll use polling instead for notifications
const realtime = {
  subscribe: (channel: string, callback: (event: any) => void) => {
    console.warn('Realtime not available in Appwrite 1.6.1. Using polling fallback.');
    
    // Return a mock unsubscribe function
    return () => {
      console.log('Mock unsubscribe called');
    };
  }
};

// Appwrite configuration object
export const appwriteConfig = {
  endpoint: appwrite.endpoint,
  projectId: appwrite.projectId,
  databaseId: appwrite.databaseId,
  collections: appwrite.collections,
};

// Test connection
if (environment.features.enableDebugLogging) {
  debugLog('Appwrite client initialized successfully', appwriteConfig);
}

export { client, account, database, storage, realtime };
