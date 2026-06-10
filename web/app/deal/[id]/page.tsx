import { redirect } from "next/navigation";

// The deal detail now lives inside the authed app shell.
export default function LegacyDealRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/deal/${params.id}`);
}
