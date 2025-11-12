import { useEffect } from "react";

const ProfilePage = () => {
  useEffect(() => {
    document.title = "Profile | PerfumeStore";
  }, []);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-emerald-400 mb-4">Profile</h1>
      <p className="text-gray-300">Your profile details will appear here.</p>
    </div>
  );
};

export default ProfilePage;
