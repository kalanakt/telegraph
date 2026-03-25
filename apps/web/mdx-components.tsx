import { blogMdxComponents, type MdxComponentMap } from "@/components/blog-mdx-components";

export function useMDXComponents(components: MdxComponentMap = {}): MdxComponentMap {
  return {
    ...blogMdxComponents,
    ...components
  };
}
