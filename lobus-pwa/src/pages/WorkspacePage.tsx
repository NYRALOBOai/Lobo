import React, { useState, useEffect } from 'react';
import GoogleClient from '../services/GoogleClient';

const WorkspacePage: React.FC = () => {
  const [googleClient, setGoogleClient] = useState<GoogleClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState('');
  const [driveQuery, setDriveQuery] = useState('');

  useEffect(() => {
    const initClient = async () => {
      try {
        const client = new GoogleClient();
        await client.init();
        setGoogleClient(client);
        setIsAuthenticated(client.isAuthenticated());
      } catch (err: any) {
        setError("Error initializing Google Client. Check API keys in settings.");
      }
    };
    const timeoutId = setTimeout(initClient, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleAuthClick = () => {
    if (googleClient) googleClient.requestAccessToken();
  };

  const handleSignOutClick = () => {
    if (googleClient) {
      googleClient.signOut();
      setIsAuthenticated(false);
    }
  };

  const handleReadEmails = async () => {
    if (googleClient) {
      setApiResponse('Reading emails...');
      const res = await googleClient.read_latest_emails();
      setApiResponse(res);
    }
  };

  const handleSearchDrive = async () => {
    if (googleClient && driveQuery) {
      setApiResponse(`Searching for "${driveQuery}"...`);
      const res = await googleClient.search_drive_files(driveQuery);
      setApiResponse(res);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Google Workspace</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {googleClient && (
        <div>
          {isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-green-400">Successfully authenticated with Google.</p>
              <button onClick={handleSignOutClick} className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
                Sign Out
              </button>

              <div className="p-4 bg-gray-800 rounded">
                <h2 className="text-xl font-semibold mb-3">Actions</h2>
                <button onClick={handleReadEmails} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mb-2">
                  Read Latest 5 Emails
                </button>
                <div className="flex">
                  <input
                    type="text"
                    value={driveQuery}
                    onChange={(e) => setDriveQuery(e.target.value)}
                    placeholder="Search Drive..."
                    className="flex-grow p-2 rounded-l bg-gray-700 border border-gray-600 focus:outline-none"
                  />
                  <button onClick={handleSearchDrive} className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700">
                    Search
                  </button>
                </div>
              </div>

              {apiResponse && (
                <div className="p-4 bg-gray-700 rounded">
                  <h3 className="font-bold mb-2">Result:</h3>
                  <pre className="whitespace-pre-wrap text-sm">{apiResponse}</pre>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-4">Connect your Google account.</p>
              <button onClick={handleAuthClick} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                Connect to Google
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
