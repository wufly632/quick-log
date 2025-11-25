import React from 'react'
import { Modal, Spin, Alert, Typography } from 'antd'
import { BulbOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

const AiAnalysisModal = ({ visible, onClose, loading, analysis, traceId }) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BulbOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          <span>AI 错误分析报告</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Text key="trace" type="secondary" style={{ float: 'left' }}>
          Trace ID: {traceId}
        </Text>,
        <button key="close" onClick={onClose} style={{ padding: '6px 16px' }}>
          关闭
        </button>,
      ]}
      destroyOnClose
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            AI 正在分析错误日志，请稍候...
          </div>
        </div>
      )}

      {!loading && !analysis && (
        <Alert
          message="未找到错误日志"
          description="该 trace_id 没有找到相关的错误日志可供分析。"
          type="warning"
          showIcon
        />
      )}

      {!loading && analysis && (
        <div
          style={{
            background: '#f5f5f5',
            padding: '24px',
            borderRadius: '8px',
            maxHeight: '500px',
            overflow: 'auto',
          }}
        >
          <Paragraph
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.8',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            }}
          >
            {analysis}
          </Paragraph>
        </div>
      )}
    </Modal>
  )
}

export default AiAnalysisModal
