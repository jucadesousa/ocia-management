import { requireAuth } from "@/lib/dal";
import { ChangePasswordForm } from "./_components/change-password-form";

export default async function ChangePasswordPage() {
  await requireAuth();

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Change Password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your current password to confirm your identity, then choose a new one.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
