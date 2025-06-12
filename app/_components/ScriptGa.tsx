"use client";
import Script from "next/script";

const ScriptGa = () => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        defer
        id="ga-connect"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        defer
        id="ga-track"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }
          gtag("js", new Date());
          gtag("config", '${gaId}');
        `}
      </Script>
    </>
  );
};

export default ScriptGa;
