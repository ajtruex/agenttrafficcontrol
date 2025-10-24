import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.worker\.(js|ts)$/i,
      loader: "worker_loader",
      options: {
        type: "module",
      },
    });

    return config;
  },
};

export default nextConfig;
