import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "acdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "api.aabenaalborg.dk" },
      { protocol: "https", hostname: "aroseny.com" },
      { protocol: "https", hostname: "blackandwalnut.com.sg" },
      { protocol: "https", hostname: "comabien.es" },
      { protocol: "https", hostname: "down-id.img.susercontent.com" },
      { protocol: "https", hostname: "drinkshouse247.co.uk" },
      { protocol: "https", hostname: "halfwine.com" },
      { protocol: "https", hostname: "imag.bonviveur.com" },
      { protocol: "https", hostname: "images.trvl-media.com" },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      { protocol: "https", hostname: "kosice.melrosebarber.sk" },
      { protocol: "https", hostname: "marydisomma.com" },
      { protocol: "https", hostname: "media.kohlsimg.com" },
      { protocol: "https", hostname: "media.zid.store" },
      { protocol: "https", hostname: "peakperu.com" },
      { protocol: "https", hostname: "playo.gumlet.io" },
      { protocol: "https", hostname: "pub-ba1a74be17d7442a9f2541946eb9510e.r2.dev" },
      { protocol: "https", hostname: "skinlab.com.au" },
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "www.deliargentina.com" },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
