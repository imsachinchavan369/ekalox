import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/components/legal/legalContent";

export const metadata: Metadata = {
  title: "Refund Policy | EKALOX",
  description: legalDocuments.refund.description,
};

export default function RefundPage() {
  return <LegalDocumentPage document={legalDocuments.refund} />;
}
