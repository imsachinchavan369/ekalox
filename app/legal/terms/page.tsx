import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/components/legal/legalContent";

export const metadata: Metadata = {
  title: "Terms of Service | EKALOX",
  description: legalDocuments.terms.description,
};

export default function TermsPage() {
  return <LegalDocumentPage document={legalDocuments.terms} />;
}
