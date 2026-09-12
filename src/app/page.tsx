"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "super_admin") {
      router.replace("/platform");
    } else {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return null;
}
