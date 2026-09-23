import { createFileRoute } from "@tanstack/react-router";
import { AdminEmailCenter } from "@/components/admin/AdminEmailCenter";

export const Route = createFileRoute("/_authenticated/admin/email")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email Center — Bnoy Study Admin" },
      { name: "description", content: "SMTP settings, email composer, templates, automations, queue and delivery logs." },
      { property: "og:title", content: "Email Center — Bnoy Study Admin" },
      { property: "og:description", content: "Configure delivery, send campaigns and monitor every email the app sends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Email Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Delivery settings, composer, templates, automations, queue and logs — one place for every email.
        </p>
      </header>
      <AdminEmailCenter />
    </div>
  ),
});
