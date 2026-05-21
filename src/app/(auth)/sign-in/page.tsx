import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 text-zinc-900 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">ObraFlow</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Entre com suas credenciais para acessar o sistema.
        </p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
