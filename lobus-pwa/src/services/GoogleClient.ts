import { useAppStore } from '../store/useAppStore';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly';

class GoogleClient {
  private tokenClient: any = null;

  private async loadGapi() {
    return new Promise<void>((resolve) => {
      if (window.gapi) {
        window.gapi.load('client', resolve);
      }
    });
  }

  async init() {
    await this.loadGapi();
    const { providers } = useAppStore.getState();
    const { apiKey, clientId } = providers.google;

    await window.gapi.client.init({
      apiKey: apiKey,
      clientId: clientId,
      scope: SCOPES,
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
      ],
    });

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        console.log('Google Auth Token received:', tokenResponse);
      },
    });
  }

  isAuthenticated(): boolean {
    return !!window.gapi?.client?.getToken();
  }

  requestAccessToken() {
    this.tokenClient.requestAccessToken();
  }

  signOut() {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {});
      window.gapi.client.setToken(null);
    }
  }

  // --- API Methods ---

  async read_latest_emails(count = 5) {
    if (!this.isAuthenticated()) throw new Error('Not authenticated with Google.');
    const response = await window.gapi.client.gmail.users.messages.list({
      'userId': 'me',
      'maxResults': count
    });

    const messages = response.result.messages || [];
    const emailPromises = messages.map(async (msg: any) => {
      const email = await window.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'METADATA',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });
      const headers = email.result.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value;
      const from = headers.find((h: any) => h.name === 'From')?.value;
      return `From: ${from}, Subject: ${subject}`;
    });

    const emails = await Promise.all(emailPromises);
    return `Here are your latest emails:\n- ${emails.join('\n- ')}`;
  }

  async search_drive_files(query: string) {
    if (!this.isAuthenticated()) throw new Error('Not authenticated with Google.');
    const response = await window.gapi.client.drive.files.list({
      'q': `name contains '${query}' and trashed = false`,
      'fields': 'files(id, name, webViewLink)',
      'pageSize': 5
    });

    const files = response.result.files || [];
    if (files.length === 0) {
      return `No files found matching "${query}".`;
    }
    const fileList = files.map((f: any) => `${f.name} (Link: ${f.webViewLink})`);
    return `Found these files on your Drive:\n- ${fileList.join('\n- ')}`;
  }
}

export default GoogleClient;
