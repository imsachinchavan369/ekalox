import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/components/legal/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy | EKALOX",
  description: legalDocuments.privacy.description,
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={legalDocuments.privacy} />;
}
