import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next blocks dev assets for any origin other than localhost. Without this,
   * opening the dev server from a phone on the same Wi-Fi shows the page but
   * none of the JavaScript, so nothing responds to touch.
   */
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
