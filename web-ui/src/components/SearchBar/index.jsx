import React from 'react'
import { Input, Space, Button, Tooltip, Popover } from 'antd'
import { SearchOutlined, QuestionCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import TimeRangePicker from '../TimeRangePicker'

const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = React.useState('')
  // 初始化为相对时间 "1小时"
  const [timeRange, setTimeRange] = React.useState({
    type: 'relative',
    key: '15m',
    label: '15分钟',
    dates: [dayjs().subtract(15, 'minute'), dayjs()]
  })
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // 自动将小写布尔运算符转换为大写
  const normalizeQuery = (q) => {
    if (!q) return '*'
    // 使用正则表达式替换独立的 and/or/not 为大写
    return q
      .replace(/\b(and)\b/gi, 'AND')
      .replace(/\b(or)\b/gi, 'OR')
      .replace(/\b(not)\b/gi, 'NOT')
  }

  const handleTimeRangeChange = (newTimeRange) => {
    console.log('Time range changed:', newTimeRange) // 调试信息
    setTimeRange(newTimeRange)
    setPopoverOpen(false) // 选择时间后自动关闭弹窗
  }

  const handleSearch = () => {
    if (!timeRange || !timeRange.dates || timeRange.dates.length !== 2) {
      return
    }

    // 如果是相对时间，只传 key 给服务端，由服务端计算具体时间
    if (timeRange.type === 'relative') {
      console.log('Searching with relative time:', timeRange.key) // 调试信息
      onSearch({
        query: normalizeQuery(query),
        time_range_type: 'relative',
        relative_time_key: timeRange.key,
      })
    } else {
      // 如果是绝对时间，传具体的时间戳
      console.log('Searching with absolute time:', {start: timeRange.dates[0].toISOString(), end: timeRange.dates[1].toISOString()}) // 调试信息
      onSearch({
        query: normalizeQuery(query),
        time_range_type: 'absolute',
        start_time: timeRange.dates[0].toISOString(),
        end_time: timeRange.dates[1].toISOString(),
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatTimeRange = () => {
    if (!timeRange || !timeRange.dates || timeRange.dates.length !== 2) return '选择时间'

    // 相对时间显示 label
    if (timeRange.type === 'relative') {
      return `最近${timeRange.label}`
    }

    // 绝对时间显示具体日期
    const start = timeRange.dates[0].format('YYYY-MM-DD HH:mm')
    const end = timeRange.dates[1].format('YYYY-MM-DD HH:mm')
    return `${start} ~ ${end}`
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space.Compact style={{ width: '100%' }} size="large">
        <Input
          placeholder="搜索日志... (如: 登录 and abc123 或 ERROR or WARN)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          size="large"
          prefix={<SearchOutlined />}
          suffix={
            <Tooltip title={
              <div>
                <div style={{marginBottom: '8px', fontWeight: 'bold'}}>支持 Lucene 查询语法：</div>
                <div style={{marginBottom: '4px'}}>基础搜索：</div>
                <div>• ERROR - 搜索包含 ERROR 的日志</div>
                <div>• &quot;database error&quot; - 精确匹配短语</div>
                <div style={{marginTop: '8px', marginBottom: '4px'}}>布尔运算（大小写均可）：</div>
                <div>• ERROR AND timeout - 同时包含</div>
                <div>• ERROR OR WARN - 任意一个</div>
                <div>• NOT ERROR - 排除</div>
                <div style={{fontSize: '12px', color: '#999', marginTop: '4px'}}>💡 提示：and/or/not 会自动转换为大写</div>
                <div style={{marginTop: '8px', marginBottom: '4px'}}>字段搜索：</div>
                <div>• level:ERROR - 按级别搜索</div>
                <div>• service:api-gateway - 按服务搜索</div>
                <div>• trace_id:abc123 - 按 Trace ID 搜索</div>
                <div>• message:数据库 - 按消息内容搜索</div>
              </div>
            }>
              <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          }
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          size="large"
        >
          搜索
        </Button>
      </Space.Compact>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ color: '#666', fontSize: '14px' }}>时间范围:</span>
        <Popover
          content={
            <TimeRangePicker
              value={timeRange}
              onChange={handleTimeRangeChange}
            />
          }
          title="选择时间范围"
          trigger="click"
          placement="bottomLeft"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <Button
            icon={<ClockCircleOutlined />}
            style={{ width: '280px', textAlign: 'left' }}
          >
            {formatTimeRange()}
          </Button>
        </Popover>
      </div>
    </Space>
  )
}

export default SearchBar
