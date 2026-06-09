export interface AzureJwtPayload {
  aud: string; // Client ID
  iss: string; // Issuer (Microsoft)
  iat: number; // Issued at
  exp: number; // Expiration (Unix Timestamp)
  name: string; // Nome completo
  email?: string; // Email (se presente nello scope)
  preferred_username: string; // Spesso l'email aziendale principale
  tid: string; // Tenant ID (l'azienda del cliente)
  oid: string; // Object ID dell'utente su Azure
  roles?: string[]; // Ruoli applicativi (se configurati)
  metadata: any;
}
