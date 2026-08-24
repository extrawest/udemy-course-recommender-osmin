"use client";

import { Typography, Spin, theme } from "antd";

const { Link } = Typography;
const URL_RE = /(https?:\/\/[^\s)]+)/g;

function linkify(text) {
  return text.split(URL_RE).map((part, i) =>
    part.startsWith("http") ? (
      <Link key={i} href={part} target="_blank" rel="noreferrer">
        {part}
      </Link>
    ) : (
      part
    )
  );
}

export default function Message({ role, content }) {
  const { token } = theme.useToken();
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <span
        style={{
          maxWidth: "80%",
          padding: "8px 12px",
          borderRadius: token.borderRadiusLG,
          whiteSpace: "pre-wrap",
          background: isUser ? token.colorPrimary : token.colorFillSecondary,
          color: isUser ? token.colorTextLightSolid : token.colorText,
        }}
      >
        {content ? linkify(content) : <Spin size="small" />}
      </span>
    </div>
  );
}
