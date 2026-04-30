import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Receipt,
  ShieldCheck,
} from "lucide-react";

export const siteConfig = {
  name: "Medora",
  description:
    "Appointments, WhatsApp reminders, digital prescriptions, billing & analytics — one calm dashboard your reception, doctors and patients will actually love.",
  copyright: "© 2026 Medora. All rights reserved.",
};

export type NavLink = {
  label: string;
  href: string;
};

export const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Find a clinic", href: "/find-clinics" },
  { label: "Contact", href: "#contact" },
];

export const footerLinks: NavLink[] = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "DPDP & HIPAA", href: "#" },
];

export type Stat = {
  value: string;
  label: string;
};

export const heroStats: Stat[] = [
  { value: "1,200+", label: "Clinics" },
  { value: "98%", label: "Show-up rate" },
  { value: "15s", label: "To register a walk-in" },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: CalendarDays,
    title: "Smart appointments",
    description:
      "Day/week/month views, drag-to-reschedule, double-booking prevention.",
  },
  {
    icon: MessageSquareText,
    title: "WhatsApp bot",
    description:
      "Patients book, get reminders & prescriptions on chat. (Demo: simulated)",
  },
  {
    icon: FileText,
    title: "Digital prescriptions",
    description:
      "Medicine autocomplete, branded PDF, auto-delivery to patients.",
  },
  {
    icon: Receipt,
    title: "GST billing & UPI",
    description: "Razorpay-ready, GST invoices, daily revenue reports.",
  },
  {
    icon: BarChart3,
    title: "AI-powered insights",
    description: "Spot revenue trends, no-shows and bottlenecks at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "HIPAA-aligned",
    description:
      "AES-256 at rest, TLS 1.3, row-level tenant isolation, audit logs.",
  },
];

export type Plan = {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "outline";
  highlighted: boolean;
};

export type ContactChannel = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
};

export const contactChannels: ContactChannel[] = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@medora.app",
    href: "mailto:hello@medora.app",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+91 98XXX XXXXX",
    href: "https://wa.me/919800000000",
  },
  {
    icon: CalendarCheck,
    label: "Book a demo",
    value: "15-min walkthrough",
    href: "mailto:hello@medora.app?subject=Medora%20demo",
  },
];

export type ContactFact = {
  icon: LucideIcon;
  label: string;
};

export const contactFacts: ContactFact[] = [
  { icon: Clock3, label: "Reply within one business day" },
  { icon: MapPin, label: "Based in India · IST timezone" },
  { icon: ShieldCheck, label: "DPDP & HIPAA aligned" },
];

export const contactMeta = {
  eyebrow: "Contact",
  title: "Talk to a human,\nnot a ticket.",
  description:
    "Questions about onboarding, pricing or compliance? We're a small team — your message lands directly with someone who can help.",
  primaryCta: { label: "Book a demo", href: "mailto:hello@medora.app?subject=Medora%20demo" },
  secondaryCta: { label: "Email us", href: "mailto:hello@medora.app" },
};

export const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹499",
    cadence: "/mo",
    features: ["1 doctor", "100 patients", "WhatsApp bot", "Basic analytics"],
    cta: "Start free trial",
    ctaVariant: "outline",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹1,499",
    cadence: "/mo",
    features: [
      "3 doctors",
      "Unlimited patients",
      "AI insights",
      "Prescription PDFs",
      "Razorpay payments",
    ],
    cta: "Start free trial",
    ctaVariant: "primary",
    highlighted: true,
  },
  {
    name: "Clinic",
    price: "₹3,999",
    cadence: "/mo",
    features: [
      "Unlimited doctors",
      "Multi-location",
      "Priority support",
      "Custom branding",
    ],
    cta: "Talk to sales",
    ctaVariant: "outline",
    highlighted: false,
  },
];
