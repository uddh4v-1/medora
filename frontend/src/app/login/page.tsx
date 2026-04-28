import type { Metadata } from "next";

import { LoginForm } from "./_components/login-form";
import { LoginSidePanel } from "./_components/login-side-panel";

export const metadata: Metadata = {
  title: "Login — Medora",
  description: "Log in to your Medora dashboard.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <LoginSidePanel />
      <LoginForm />
    </div>
  );
}
