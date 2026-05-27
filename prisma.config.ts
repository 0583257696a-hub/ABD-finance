import { defineConfig } from 'prisma/config'

function withSslMode(url: string) {
  const parsed = new URL(url)
  if (!parsed.searchParams.has('sslmode')) {
    parsed.searchParams.set('sslmode', 'require')
  }
  return parsed.toString()
}

const datasourceUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/abd_finance'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: withSslMode(datasourceUrl),
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      'auth.users',
      'auth.schema_migrations',
      'auth.identities',
      'auth.sessions',
      'auth.refresh_tokens',
      'auth.mfa_factors',
      'auth.mfa_challenges',
      'auth.mfa_amr_claims',
      'auth.flow_state',
      'auth.audit_log_entries',
      'auth.instances',
      'auth.sso_providers',
      'auth.sso_domains',
      'auth.saml_providers',
      'auth.saml_relay_states',
      'auth.oauth_clients',
      'auth.oauth_client_states',
      'auth.oauth_authorizations',
      'auth.oauth_consents',
      'auth.custom_oauth_providers',
      'auth.webauthn_challenges',
      'auth.webauthn_credentials',
      'auth.one_time_tokens',
      'public.profiles',
    ],
  },
  enums: {
    external: [
      'auth.aal_level',
      'auth.code_challenge_method',
      'auth.factor_status',
      'auth.factor_type',
      'auth.oauth_authorization_status',
      'auth.oauth_client_type',
      'auth.oauth_registration_type',
      'auth.oauth_response_type',
      'auth.one_time_token_type',
    ],
  },
})
