export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env or your hosting environment configuration.`,
    );
  }
  return value;
}

export function getRequiredEnvs() {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    nextAuthUrl: requireEnv("NEXTAUTH_URL"),
    nextAuthSecret: requireEnv("NEXTAUTH_SECRET"),
  };
}