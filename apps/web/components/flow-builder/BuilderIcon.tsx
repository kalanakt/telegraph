"use client";

import {
  Bot,
  Clock3,
  CreditCard,
  FileText,
  Filter,
  FormInput,
  GitBranch,
  Globe,
  Image,
  MessageSquareText,
  Package,
  RefreshCcw,
  Shield,
  UserRound,
  Variable,
  Webhook,
  Zap,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  bot: Bot,
  branch: GitBranch,
  delay: Clock3,
  "credit-card": CreditCard,
  file: FileText,
  filter: Filter,
  form: FormInput,
  globe: Globe,
  image: Image,
  message: MessageSquareText,
  package: Package,
  refresh: RefreshCcw,
  shield: Shield,
  trigger: Zap,
  user: UserRound,
  variable: Variable,
  video: Image,
  webhook: Webhook,
  zap: Zap,
};

export function BuilderIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Zap;
  return <Icon className={className} />;
}
