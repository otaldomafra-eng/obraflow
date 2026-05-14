/**
 * Helper para garantir que variáveis de ambiente obrigatórias estejam definidas.
 * Lança erro claro se alguma estiver ausente, evitando falhas silenciosas.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check .env or your hosting environment configuration.`,
    );
  }
  return value;
}