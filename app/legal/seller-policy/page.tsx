import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { legalDocuments } from "@/components/legal/legalContent";

export const metadata: Metadata = {
  title: "Seller Policy | EKALOX",
  description: legalDocuments.sellerPolicy.description,
};

export default function SellerPolicyPage() {
  return <LegalDocumentPage document={legalDocuments.sellerPolicy} />;
}
