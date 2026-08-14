import { requireAuth } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { StaffPhotoUpload } from "./_components/staff-photo-upload";
import { ProfileForm } from "./_components/profile-form";

export default async function MyProfilePage() {
  const authUser = await requireAuth();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: authUser.id },
    select: { name: true, bio: true, photoUrl: true, isPublished: true },
  });

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 mb-6">
        This is what appears on the public Team page when published.
      </p>

      <StaffPhotoUpload photoUrl={user.photoUrl} name={user.name} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ProfileForm bio={user.bio} isPublished={user.isPublished} />
      </div>
    </div>
  );
}
