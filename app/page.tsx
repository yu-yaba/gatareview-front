import './globals.css';
import HomePageClient from './_components/HomePageClient';
import { getHomePageData } from './_helpers/serverLectureApi';

export default async function Page() {
  const homePageData = await getHomePageData();

  return <HomePageClient {...homePageData} />;
}
