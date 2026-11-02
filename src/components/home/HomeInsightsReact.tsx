import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import type { PostSummary } from "../../utils/postMeta";
import PostCardsSection from "../shared/PostCardsSection";

export type InsightPost = PostSummary;

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  posts: InsightPost[];
}

export default function HomeInsightsReact({ query, variables, data: initialData, locale = "es", posts }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const blog = data?.home?.blogPreview || initialData?.home?.blogPreview;
  return (
    <PostCardsSection
      posts={posts}
      title={tField(blog, "title", locale)}
      titleTinaField={blog ? tinaField(blog as any, "title") : undefined}
      buttonText={tField(blog, "buttonText", locale)}
      buttonHref={blog?.buttonUrl || "/blog"}
      buttonTinaField={blog ? tinaField(blog as any, "buttonText") : undefined}
      locale={locale}
    />
  );
}
