import type { ComponentType } from "react";
import { blogMdxComponents } from "@/components/blog-mdx-components";

type MdxComponentMap = Record<string, ComponentType<any>>;

export function useMDXComponents(components: MdxComponentMap = {}): MdxComponentMap {
  return {
    ...blogMdxComponents,
    ...components
  };
}
