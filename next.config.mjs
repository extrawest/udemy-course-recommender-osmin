/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  serverExternalPackages: ["@langchain/langgraph-checkpoint-postgres", "pg", "mammoth"],
};

export default nextConfig;
