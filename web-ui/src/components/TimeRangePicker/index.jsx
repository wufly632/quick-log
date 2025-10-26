import React, { useState } from 'react'
import { DatePicker, Tabs, Button, Divider } from 'antd'
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import styles from './index.module.css'

const { RangePicker } = DatePicker

/**
 * 增强的时间范围选择器，支持相对时间和绝对时间
 * 参考阿里云 SLS 的时间选择交互
 */
const TimeRangePicker = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState('relative')
  const [customRange, setCustomRange] = useState(value?.dates || [dayjs().subtract(1, 'hour'), dayjs()])

  // 相对时间预设 - 只存储 key，由服务端计算具体时间
  const relativePresets = [
    { label: '1分钟', key: '1m', description: '最近1分钟' },
    { label: '5分钟', key: '5m', description: '最近5分钟' },
    { label: '15分钟', key: '15m', description: '最近15分钟' },
    { label: '1小时', key: '1h', description: '最近1小时' },
    { label: '4小时', key: '4h', description: '最近4小时' },
    { label: '1天', key: '1d', description: '最近1天' },
    { label: '7天', key: '7d', description: '最近7天' },
    { label: '30天', key: '30d', description: '最近30天' },
  ]

  // 绝对时间快捷选择 - 计算并传输具体日期
  const absolutePresets = [
    { label: '今天', value: () => [dayjs().startOf('day'), dayjs()], key: 'today' },
    { label: '昨天', value: () => [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')], key: 'yesterday' },
    { label: '本周', value: () => [dayjs().startOf('week'), dayjs()], key: 'week' },
    { label: '上周', value: () => [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')], key: 'lastweek' },
    { label: '本月', value: () => [dayjs().startOf('month'), dayjs()], key: 'month' },
    { label: '上月', value: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')], key: 'lastmonth' },
  ]

  // 选择相对时间：只传 key 给服务端
  const handleRelativeSelect = (preset) => {
    onChange({
      type: 'relative',
      key: preset.key,
      label: preset.label,
      // 前端也保存计算结果用于显示
      dates: [dayjs().subtract(getRelativeMinutes(preset.key), 'minute'), dayjs()]
    })
  }

  // 选择绝对时间快捷选项：传具体日期
  const handleAbsoluteSelect = (preset) => {
    const dates = preset.value()
    setCustomRange(dates)
    onChange({
      type: 'absolute',
      key: preset.key,
      label: preset.label,
      dates: dates
    })
  }

  // 自定义日期范围：传具体日期
  const handleCustomRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setCustomRange(dates)
      onChange({
        type: 'absolute',
        key: 'custom',
        label: '自定义范围',
        dates: dates
      })
    }
  }

  // 根据相对时间 key 获取分钟数（仅用于前端显示）
  const getRelativeMinutes = (key) => {
    const map = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
      '7d': 10080,
      '30d': 43200,
    }
    return map[key] || 60
  }

  const tabItems = [
    {
      key: 'relative',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: '6px' }} />
          相对时间
        </span>
      ),
      children: (
        <div className={styles.presetContainer}>
          <div className={styles.presetsGrid}>
            {relativePresets.map((preset) => (
              <Button
                key={preset.key}
                type="text"
                className={styles.presetButton}
                onClick={() => handleRelativeSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ fontSize: '12px', color: '#999', padding: '0 8px' }}>
            💡 相对时间基于当前时刻计算，自动更新
          </div>
        </div>
      ),
    },
    {
      key: 'absolute',
      label: (
        <span>
          <CalendarOutlined style={{ marginRight: '6px' }} />
          绝对时间
        </span>
      ),
      children: (
        <div className={styles.absoluteContainer}>
          <div className={styles.presetsGrid} style={{ marginBottom: '12px' }}>
            {absolutePresets.map((preset) => (
              <Button
                key={preset.key}
                type="text"
                className={styles.presetButton}
                onClick={() => handleAbsoluteSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ padding: '8px 0' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              自定义时间范围
            </label>
            <RangePicker
              value={customRange}
              onChange={handleCustomRangeChange}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.timeRangePickerContainer}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
      />
    </div>
  )
}

export default TimeRangePicker
