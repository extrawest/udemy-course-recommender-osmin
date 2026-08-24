"use client";

import { Upload, Typography } from "antd";

const { Text } = Typography;

export default function CvUploader({ loading, onUpload }) {
  return (
    <Upload.Dragger
      accept=".pdf,.docx,.png,.jpg,.jpeg"
      multiple={false}
      showUploadList={false}
      disabled={loading}
      beforeUpload={(file) => {
        onUpload(file);
        return false;
      }}
    >
      <p style={{ fontSize: 40, margin: 0 }}>📄</p>
      <p className="ant-upload-text">
        {loading ? "Reading your CV…" : "Click or drag your CV here"}
      </p>
    </Upload.Dragger>
  );
}
