import './globals.css';
import HomePageClient from './_components/HomePageClient';
import { getHomePageData } from './_helpers/serverLectureApi';
import type { Metadata } from 'next';
import { HOME_DESCRIPTION, HOME_TITLE, indexablePageMetadata } from './_helpers/seo';

export const metadata: Metadata = indexablePageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

export default async function Page() {
  const homePageData = await getHomePageData();

  return <HomePageClient {...homePageData} />;
}
