import React, { useState } from 'react'
import { Tag, Typography, Space, Tooltip, Switch, Pagination, Spin, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

const LogTable = ({ data, loading, pagination, onChange }) => {
  const [wrapText, setWrapText] = useState(false)

  const getLevelColor = (level) => {
    const colors = {
      ERROR: 'error',
      WARN: 'warning',
      INFO: 'processing',
      DEBUG: 'default',
    }
    return colors[level] || 'default'
  }

  const copyToClipboard = async (text) => {
    if (text === undefined || text === null) {
      return
    }

    const value = typeof text === 'string' ? text : JSON.stringify(text)

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      message.success('复制成功')
    } catch (error) {
      message.error('复制失败，请重试')
    }
  }

  // 渲染日志卡片 - 一行一字段格式
  const renderLogCard = (record, index) => {
    const renderField = (label, value, options = {}) => {
      if (value === undefined || value === null) return null

      const {
        containerStyle = {},
        valueStyle = {},
        displayValue,
        copyValue = value,
      } = options

      const content = displayValue !== undefined ? displayValue : value
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '4px 0',
            fontSize: '13px',
            fontFamily: 'Monaco, Menlo, Consolas, monospace',
            lineHeight: '1.6',
            ...containerStyle,
          }}
        >
          <span style={{ color: '#1890ff', fontWeight: 600, minWidth: '72px' }}>{label}:</span>
          <span style={{ flex: 1, ...valueStyle }}>
            {content}
          </span>
          <Tooltip title="复制">
            <CopyOutlined
              style={{ color: '#1890ff', cursor: 'pointer', marginTop: 2 }}
              onClick={() => copyToClipboard(copyValue)}
            />
          </Tooltip>
        </div>
      )
    }

    return (
      <div
        key={`${record.timestamp}-${index}`}
        style={{
          padding: '16px',
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          marginBottom: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'}
      >
        {renderField('level', record.level, {
          displayValue: (
            <Tag color={getLevelColor(record.level)} style={{ marginRight: 0 }}>
              {record.level}
            </Tag>
          ),
        })}
        {renderField('time', dayjs(record.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS'))}
        {renderField('service', record.service)}
        {renderField('host', record.host)}
        {renderField('env', record.env)}
        {renderField('trace_id', record.trace_id)}
        {record.span_id && renderField('span_id', record.span_id)}

        {renderField('message', record.message, {
          containerStyle: {
            paddingTop: '8px',
            borderTop: '1px dashed #d9d9d9',
            marginTop: '8px',
          },
          valueStyle: wrapText
            ? {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }
            : {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
          copyValue: record.message,
        })}

        {record.stack_trace && (
          <div style={{
            padding: '8px 0',
            marginTop: '8px',
            borderTop: '1px dashed #d9d9d9'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#1890ff',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              <span>stack_trace:</span>
              <Tooltip title="复制">
                <CopyOutlined
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => copyToClipboard(record.stack_trace.replace(/\\n/g, '\n').replace(/\\t/g, '\t'))}
                />
              </Tooltip>
            </div>
            <div style={{
              whiteSpace: 'pre-wrap',
              background: '#fff1f0',
              padding: '8px',
              borderRadius: '2px',
              color: '#cf1322',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, Consolas, monospace',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {/* 将转义字符序列 \n\t 转换为实际的换行和制表符 */}
              {record.stack_trace.replace(/\\n/g, '\n').replace(/\\t/g, '\t')}
            </div>
          </div>
        )}

        {record.labels && (
          <div style={{
            padding: '8px 0',
            marginTop: '8px',
            borderTop: '1px dashed #d9d9d9'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#1890ff',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              <span>labels:</span>
              <Tooltip title="复制">
                <CopyOutlined
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => copyToClipboard(JSON.stringify(record.labels, null, 2))}
                />
              </Tooltip>
            </div>
            <pre style={{
              margin: 0,
              background: '#f6ffed',
              padding: '8px',
              borderRadius: '2px',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, Consolas, monospace',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(record.labels, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const handlePaginationChange = (page, pageSize) => {
    onChange({ current: page, pageSize })
  }

  return (
    <div>
      {/* 工具栏 */}
      <div style={{
        marginBottom: '12px',
        padding: '8px 12px',
        background: '#fafafa',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Space>
          <Text style={{ fontSize: '13px', color: '#666' }}>换行:</Text>
          <Switch
            checked={wrapText}
            onChange={setWrapText}
            size="small"
          />
        </Space>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {wrapText ? '已启用自动换行' : '长文本将被截断'}
        </Text>
      </div>

      {/* 日志列表 */}
      <Spin spinning={loading}>
        <div style={{ minHeight: '400px' }}>
          {data && data.length > 0 ? (
            data.map((record, index) => renderLogCard(record, index))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#999'
            }}>
              暂无数据
            </div>
          )}
        </div>
      </Spin>

      {/* 分页控件 */}
      {pagination && pagination.total > 0 && (
        <div style={{
          marginTop: '16px',
          textAlign: 'right',
          padding: '12px',
          background: '#fafafa',
          borderRadius: '4px'
        }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
            pageSizeOptions={['10', '20', '50', '100']}
          />
        </div>
      )}
    </div>
  )
}

export default LogTable
