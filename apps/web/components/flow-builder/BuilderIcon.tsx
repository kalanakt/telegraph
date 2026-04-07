"use client";

import {
  Bot,
  Clock3,
  FileText,
  Filter,
  GitBranch,
  Globe,
  Image,
  MessageSquareText,
  Shield,
  Variable,
  Webhook,
  Zap,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  bot: Bot,
  branch: GitBranch,
  delay: Clock3,
  file: FileText,
  filter: Filter,
  globe: Globe,
  image: Image,
  message: MessageSquareText,
  shield: Shield,
  trigger: Zap,
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
