"use client";

import { Layout, Typography, Button, Space } from "antd";
import CvUploader from "@/components/CvUploader";
import ChatPanel from "@/components/ChatPanel";
import { useCv } from "@/hooks/useCv";
import { getSessionId } from "@/lib/session";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const { cv, loading, upload, reset } = useCv();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ width: "100%", maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
        <Title level={3}>Udemy Course Recommender</Title>

        {!cv ? (
          <>
            <Text type="secondary">
              Upload your CV to get the top 3 udemy courses to level up.
            </Text>
            <div style={{ marginTop: 16 }}>
              <CvUploader loading={loading} onUpload={(file) => upload(file, getSessionId())} />
            </div>
          </>
        ) : (
          <>
            <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
              <Text>
                Your profile: {cv.profile.summary}
              </Text>
              <Button onClick={reset}>New CV</Button>
            </Space>
            <ChatPanel key={cv.threadId} threadId={cv.threadId} />
          </>
        )}
      </Content>
    </Layout>
  );
}
