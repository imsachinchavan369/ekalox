import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/components/legal/legalContent";

export const metadata: Metadata = {
  title: "Affiliate Terms | EKALOX",
  description: legalDocuments.affiliateTerms.description,
};

export default function AffiliateTermsPage() {
  return <LegalDocumentPage document={legalDocuments.affiliateTerms} />;
}
