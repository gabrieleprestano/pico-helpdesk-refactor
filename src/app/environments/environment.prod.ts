export const environment = {
  production: true,
  apiBaseUrl: 'https://pico.ggroup.cloud/api',
  //apiBaseUrl: 'http://localhost:3000',
  azureAd: {
    clientId: 'INSERISCI-CLIENT-ID-AZURE',
    tenantId: 'common',
    redirectUri: window.location.origin + '/login',
    postLogoutRedirectUri: window.location.origin + '/login',
    scopes: ['User.Read']
  }
};
