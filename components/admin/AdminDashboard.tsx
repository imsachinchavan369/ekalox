"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminNotificationBadge } from "@/components/admin/AdminNotificationBadge";
import { ModerationStatusBadge } from "@/components/common/ModerationStatusBadge";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import type { AdminDashboardData } from "@/lib/moderation/queries";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Admin action failed.");
  }
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const filteredProducts = useMemo(
    () => data.products.filter((product) => filter === "all" || product.moderationStatus === filter || product.verificationStatus === filter),
    [data.products, filter],
  );

  const refreshAfter = async (promise: Promise<void>) => {
    await promise;
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <Section title="Overview">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Users", data.stats.users],
            ["Creators", data.stats.creators],
            ["Products", data.stats.products],
            ["Open reports", data.stats.openReports],
            ["Replacement requests", data.stats.pendingReplacements],
            ["Unread alerts", data.stats.unreadNotifications],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reports">
        <div className="space-y-3">
          {data.reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ModerationStatusBadge status={report.status} />
                <p className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {report.reason.replace(/_/g, " ")} · product {report.productId}
              </p>
              {report.note ? <p className="mt-2 text-sm leading-6 text-slate-400">{report.note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/reports/${report.id}`, { status: "under_review" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Under Review
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/reports/${report.id}`, { status: "resolved" }))} className="rounded-full bg-cyan-300/12 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/18">
                  Resolve
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/reports/${report.id}`, { status: "rejected" }))} className="rounded-full bg-rose-300/12 px-3 py-1.5 text-xs font-black text-rose-100 transition hover:bg-rose-300/18">
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Products / Reels">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white outline-none">
            <option value="all">All</option>
            <option value="unverified">Unverified</option>
            <option value="under_review">Under review</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="removed">Removed</option>
          </select>
        </div>
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-white">{product.title}</p>
                {product.verificationStatus === "verified" ? <VerifiedByEkaloxBadge /> : null}
                <ModerationStatusBadge status={product.moderationStatus} />
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                  {product.status} / {product.visibility}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                @{product.creatorName} - user {product.creatorUserId || "unknown"}{product.creatorEmail ? ` - ${product.creatorEmail}` : ""}
              </p>
              {product.adminNote ? <p className="mt-2 text-xs text-amber-100">Admin note: {product.adminNote}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "mark_verified" }))} className="rounded-full bg-cyan-300/12 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/18">
                  Mark Verified
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "remove_verification" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Remove Verification
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "reject_verification" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Reject Verification
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "flag_product", targetUserId: product.creatorUserId }))} className="rounded-full bg-amber-300/12 px-3 py-1.5 text-xs font-black text-amber-100 transition hover:bg-amber-300/18">
                  Flag Product
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "mark_safe" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Mark Safe
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "request_creator_clarification" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Set Under Review
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "approve_and_restore", targetUserId: product.creatorUserId }))} className="rounded-full bg-emerald-300/12 px-3 py-1.5 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/18">
                  Approve / Restore
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "unpublish_item" }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Unpublish
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "remove_item" }))} className="rounded-full bg-rose-300/12 px-3 py-1.5 text-xs font-black text-rose-100 transition hover:bg-rose-300/18">
                  Delete / Remove
                </button>
                {product.creatorUserId ? (
                  <>
                    <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "lift_creator_restriction", targetUserId: product.creatorUserId }))} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                      Lift Restriction
                    </button>
                    <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/products/${product.id}/moderate`, { action: "suspend_creator", targetUserId: product.creatorUserId }))} className="rounded-full bg-rose-300/12 px-3 py-1.5 text-xs font-black text-rose-100 transition hover:bg-rose-300/18">
                      Suspend Creator
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="File Verification">
        <div className="space-y-3">
          {data.products.map((product) => (
            <article key={`${product.id}-file`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-black text-white">{product.title}</p>
              <p className="mt-2 text-xs text-slate-500">{product.fileName || "No file uploaded"}</p>
              {product.fileUrl ? (
                <a href={product.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16">
                  Verify file
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Users">
        <div className="space-y-2">
          {data.users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-black text-white">{user.displayName}</p>
              <p className="mt-1 text-xs text-slate-500">{user.email}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">{user.accountSafetyStatus || (user.isActive === false ? "suspended" : "active")}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Creators">
        <div className="space-y-2">
          {data.creators.map((creator) => (
            <div key={creator.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-black text-white">@{creator.handle}</p>
              <p className="mt-1 text-xs text-slate-500">{creator.userId}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Replacement Requests">
        <div className="space-y-3">
          {data.replacementRequests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ModerationStatusBadge status={request.status} />
                <p className="text-xs text-slate-500">product {request.productId}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{request.reason}</p>
              {request.note ? <p className="mt-2 text-sm leading-6 text-slate-400">{request.note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/replacement-requests/${request.id}`, { action: "approve" }))} className="rounded-full bg-cyan-300/12 px-3 py-1.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/18">
                  Approve Replacement
                </button>
                <button type="button" onClick={() => void refreshAfter(postJson(`/api/admin/replacement-requests/${request.id}`, { action: "reject" }))} className="rounded-full bg-rose-300/12 px-3 py-1.5 text-xs font-black text-rose-100 transition hover:bg-rose-300/18">
                  Reject Replacement
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Moderation Log">
        <div className="space-y-2">
          {data.logs.map((log, index) => (
            <div key={`${log.action}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm font-black text-white">{log.action.replace(/_/g, " ")}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
              {log.note ? <p className="mt-2 text-sm leading-6 text-slate-400">{log.note}</p> : null}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Settings / Permissions">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-white">Admin notifications</p>
              <AdminNotificationBadge count={data.stats.unreadNotifications} />
            </div>
            <div className="mt-3 space-y-2">
              {data.notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void refreshAfter(postJson(`/api/admin/notifications/${notification.id}/read`, {}))}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:bg-black/30"
                >
                  <span className="text-sm font-semibold text-white">{notification.label}</span>
                  {!notification.isRead ? <AdminNotificationBadge count={1} /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
