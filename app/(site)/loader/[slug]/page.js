"use client";

import { useParams } from "next/navigation";
import { LoaderDetailPage } from "../../../components/Site";

export default function Page() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  return <LoaderDetailPage slug={slug} />;
}
