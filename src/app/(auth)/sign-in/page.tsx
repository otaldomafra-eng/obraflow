import { SignInButton } from "./SignInButton";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">ObraFlow</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Entre com seu email para acessar o sistema.
        </p>
        <form
          action="/api/auth/callback/credentials"
          method="POST"
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <SignInButton />
        </form>
      </div>
    </div>
  );
}
