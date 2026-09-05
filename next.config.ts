import type { NextConfig } from 'next';

const githubPagesBase =
  process.env.GITHUB_ACTIONS === 'true' ? '/repo-gauntlet' : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: githubPagesBase,
  assetPrefix: githubPagesBase,
};

export default nextConfig;
