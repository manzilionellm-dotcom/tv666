"use client";

// Black Seven TV — Point d'entrée / aiguillage : redirige selon la présence
// d'identifiants Xtream enregistrés.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadCredentials } from "@/lib/auth";
import Splash from "@/components/Splash";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace(loadCredentials() ? "/home" : "/login");
  }, [router]);

  return <Splash />;
}
