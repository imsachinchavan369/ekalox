export type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const legalDocuments = {
  terms: {
    title: "Terms of Service",
    description: "Rules for using EKALOX as a buyer, seller, creator, or affiliate.",
    updatedAt: "April 26, 2026",
    sections: [
      {
        title: "Platform Role",
        body: [
          "EKALOX is a digital marketplace that allows independent sellers to list and sell digital products.",
          "EKALOX does not own, create, review every file in advance, or guarantee the products sold by sellers. Sellers are fully responsible for their products, listings, files, claims, licenses, and customer-facing information.",
        ],
      },
      {
        title: "User Responsibility",
        body: [
          "Users must use EKALOX lawfully and honestly. Buyers, sellers, creators, and affiliates are responsible for the content they upload, promote, purchase, download, or share through the platform.",
        ],
        bullets: [
          "Illegal content or products.",
          "Copyrighted content without the required rights or permissions.",
          "Adult, sexual, or sexually exploitative content.",
          "Scam products, misleading products, fake claims, or deceptive listings.",
        ],
      },
      {
        title: "Account Action",
        body: [
          "EKALOX may suspend accounts, remove products, restrict payouts, block users, disable links, or take other protective action when we believe a user has violated these terms, platform policies, law, or the safety of the marketplace.",
          "For serious violations, fraud, abuse, illegal content, or risk to users or EKALOX, action may be taken without prior notice.",
        ],
      },
      {
        title: "Digital Product Nature",
        body: [
          "All products on EKALOX are digital downloads, digital files, or digital access products. No physical delivery is provided by EKALOX.",
          "Buyers are responsible for checking the product description, format, compatibility, and usage terms before purchase.",
        ],
      },
      {
        title: "Payment Terms",
        body: [
          "Payments are processed through third-party payment providers, including Razorpay. EKALOX may rely on payment gateway confirmations, webhook events, and transaction records to determine payment status.",
          "EKALOX is not responsible for payment gateway downtime, failed payments, delayed confirmations, bank-side issues, card failures, UPI failures, chargebacks, or third-party processing errors.",
        ],
      },
      {
        title: "Fees and Commission",
        body: [
          "By default, EKALOX charges a 20% platform fee on the base price of paid products. Base price means the product price excluding GST or any applicable tax component.",
          "When affiliate mode is enabled for a product, the base price split is Seller 60%, Affiliate 25%, and Platform 15%. Affiliate mode is optional and may be disabled by default unless a seller enables it for eligible products.",
          "Fees, commissions, and earnings may be adjusted, withheld, reversed, or cancelled in cases of refunds, disputes, fraud, policy violations, failed payment settlement, or platform abuse.",
        ],
      },
      {
        title: "Tax and GST",
        body: [
          "GST at 18% may be included in the displayed price or applied based on the pricing setup used for a product or checkout flow.",
          "EKALOX does not guarantee tax compliance for sellers. Sellers are responsible for understanding, reporting, collecting, and paying their own taxes, including GST, income tax, and any other obligations that apply to them.",
        ],
      },
      {
        title: "Limitation of Liability",
        body: [
          "EKALOX is not liable for product quality, incorrect files, missing files, incompatible formats, buyer-seller disputes, user conduct, loss of data, loss of revenue, loss of business opportunity, financial losses, or indirect damages arising from platform use.",
          "To the maximum extent permitted by law, users use EKALOX at their own risk and agree that seller-provided products remain the responsibility of the seller.",
        ],
      },
      {
        title: "Termination",
        body: [
          "EKALOX may terminate or permanently restrict accounts for policy violations, fraud, illegal activity, repeated complaints, payment abuse, or harm to the platform.",
          "Termination does not guarantee refunds, restoration of files, payout recovery, account recovery, listing recovery, or continued access to platform features.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How EKALOX collects, uses, and protects platform data.",
    updatedAt: "April 26, 2026",
    sections: [
      {
        title: "Data We Collect",
        body: [
          "EKALOX collects the information needed to operate the marketplace and protect users.",
        ],
        bullets: [
          "Email address and account information.",
          "Profile, seller, creator, and affiliate information submitted by users.",
          "Usage data such as pages visited, product activity, downloads, reports, and platform interactions.",
          "Transaction data such as order status, product purchased, payment reference, settlement records, and refund or replacement requests.",
        ],
      },
      {
        title: "How We Use Data",
        body: [
          "We use data to operate EKALOX, provide accounts, process transactions, deliver digital products, show product and creator information, support users, and maintain platform security.",
          "We may also use data to improve product quality, detect abuse, prevent fraud, investigate policy violations, moderate content, and comply with legal or payment-related requirements.",
        ],
      },
      {
        title: "Third-Party Services",
        body: [
          "EKALOX uses third-party service providers to operate key parts of the platform. Razorpay may process payment data, payment status, and transaction details. Supabase may store account, product, usage, and transaction records used by the platform.",
          "These providers handle data under their own terms, policies, and security practices. Users should review those policies when using EKALOX payment or account features.",
        ],
      },
      {
        title: "No Sale of Personal Data",
        body: [
          "EKALOX does not sell personal data. We may share data only where needed to operate the platform, process payments, prevent fraud, comply with law, enforce policies, or protect EKALOX and its users.",
        ],
      },
      {
        title: "Data Protection",
        body: [
          "We use reasonable technical and operational safeguards to protect platform data. No online service can guarantee absolute security, and users are responsible for keeping their account credentials safe.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    description: "Strict refund rules for digital products sold on EKALOX.",
    updatedAt: "April 26, 2026",
    sections: [
      {
        title: "Digital Download Rule",
        body: [
          "All EKALOX products are digital products. Once a successful download or access event is recorded, refunds are not provided.",
        ],
      },
      {
        title: "When Refunds May Be Allowed",
        body: [
          "A refund may be considered only when the delivered file is corrupted or the wrong file was delivered.",
          "A request must be submitted within 48 hours of purchase or delivery. The buyer must provide clear proof, such as screenshots, error messages, file details, or other information requested by EKALOX.",
        ],
      },
      {
        title: "Non-Refundable Cases",
        bullets: [
          "Change of mind after purchase.",
          "Failure to read the product description.",
          "Device, software, or compatibility issues not caused by the seller file.",
          "Successful download or successful digital access.",
          "Disputes about product expectations where the listed file was delivered correctly.",
        ],
      },
      {
        title: "Final Decision",
        body: [
          "EKALOX may review order records, download logs, seller responses, payment status, and buyer proof before deciding a refund request. EKALOX decision is final.",
        ],
      },
    ],
  },
  sellerPolicy: {
    title: "Seller Policy",
    description: "Rules sellers must follow when listing digital products on EKALOX.",
    updatedAt: "April 26, 2026",
    sections: [
      {
        title: "Seller Responsibility",
        body: [
          "Sellers are fully responsible for product quality, legality, originality, accuracy, file delivery, listing details, claims, usage rights, and customer expectations created by their listings.",
          "Sellers must ensure they have the legal right to sell, license, distribute, or provide every product uploaded to EKALOX.",
        ],
      },
      {
        title: "Strictly Banned Content",
        bullets: [
          "Adult, sexual, or sexually exploitative content.",
          "Pirated content, copied content, leaked files, or copyrighted material without rights.",
          "Scams, misleading products, fake promises, or deceptive earning claims.",
          "Illegal products, harmful files, malware, credential theft, or products designed for abuse.",
        ],
      },
      {
        title: "Product Quality",
        body: [
          "Sellers must upload correct, usable, and reasonably described files. Product descriptions, previews, titles, categories, and prices must not mislead buyers.",
          "If a seller delivers a corrupted file or wrong file, EKALOX may require correction, replacement, refund, payout hold, or other action.",
        ],
      },
      {
        title: "No Manipulation",
        body: [
          "Sellers must not manipulate reviews, ratings, downloads, traffic, affiliate data, payment records, product rankings, reports, or any marketplace signal.",
        ],
      },
      {
        title: "Violations",
        body: [
          "Policy violations may result in product removal, rejected verification, account restrictions, payout holds, account ban, cancellation of earnings, or permanent removal from EKALOX.",
        ],
      },
    ],
  },
  affiliateTerms: {
    title: "Affiliate Terms",
    description: "Rules for promoting EKALOX products through affiliate links.",
    updatedAt: "April 26, 2026",
    sections: [
      {
        title: "Optional Affiliate Mode",
        body: [
          "Affiliate mode is optional and is off by default unless enabled for an eligible product. Sellers may choose whether to allow affiliate promotion where the platform supports it.",
        ],
      },
      {
        title: "Commission Split",
        body: [
          "When affiliate mode is enabled and a valid affiliate sale is tracked, the base price split is Seller 60%, Affiliate 25%, and Platform 15%. The split is calculated on the base price excluding GST.",
          "Affiliate earnings may depend on successful payment settlement, valid attribution, no refund, no chargeback, and compliance with these terms.",
        ],
      },
      {
        title: "Attribution Rules",
        body: [
          "EKALOX uses last-click attribution unless stated otherwise in the platform flow. The most recent valid affiliate click before purchase may receive credit for the sale.",
          "Attribution may be denied or corrected if tracking is incomplete, fraudulent, manipulated, self-generated, or affected by technical limitations.",
        ],
      },
      {
        title: "Prohibited Activity",
        bullets: [
          "Fake traffic, bot clicks, forced clicks, click spam, or misleading redirects.",
          "Self-referral abuse or purchasing through your own affiliate link to earn commission.",
          "False claims about products, sellers, earnings, discounts, refunds, or EKALOX.",
          "Promotion through illegal, adult, hateful, deceptive, or harmful channels.",
        ],
      },
      {
        title: "Violations",
        body: [
          "Affiliate violations may result in rejected attribution, earnings cancellation, payout holds, link removal, account restriction, or account ban.",
        ],
      },
    ],
  },
} satisfies Record<string, LegalDocument>;
