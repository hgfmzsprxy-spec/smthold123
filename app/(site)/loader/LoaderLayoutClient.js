"use client";

import LoaderCloudflareGate from "../../components/LoaderCloudflareGate";

export default function LoaderLayoutClient({ children }) {
  return <LoaderCloudflareGate>{children}</LoaderCloudflareGate>;
}
