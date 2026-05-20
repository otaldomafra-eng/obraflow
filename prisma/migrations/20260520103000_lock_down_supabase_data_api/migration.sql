-- Lock down Supabase Data API access for Prisma-managed application tables.
-- ObraFlow reads and writes through the server-side Prisma connection, not
-- through public Supabase REST/GraphQL endpoints.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Account',
    'AiInteraction',
    'ApprovalProcess',
    'Client',
    'Contract',
    'Document',
    'Lead',
    'Membership',
    'Message',
    'Opportunity',
    'ProjectPhase',
    'Property',
    'Proposal',
    'Service',
    'ServiceTask',
    'Session',
    'Tenant',
    'TimelineEvent',
    'User',
    'VerificationToken',
    'WorkLog',
    'WorkMeasurement',
    '_prisma_migrations'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated, service_role',
      table_name
    );
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM public;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
