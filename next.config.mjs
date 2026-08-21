/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  serverExternalPackages: [
    "@langchain/langgraph-checkpoint-sqlite",
    "better-sqlite3",
    "@langchain/community",
    "pdf-parse",
    "mammoth",
  ],
};

export default nextConfig;
