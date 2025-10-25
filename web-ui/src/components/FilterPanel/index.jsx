import React from 'react'
import { Card, Form, Select, Space, Button, Divider } from 'antd'
import { FilterOutlined, ClearOutlined } from '@ant-design/icons'

const { Option } = Select

const FilterPanel = ({ onFilterChange, onReset }) => {
  const [form] = Form.useForm()

  const handleValuesChange = (_, allValues) => {
    const filters = {}
    if (allValues.level) filters.level = allValues.level
    // service 可能是数组（tags模式），取第一个值
    if (allValues.service) {
      filters.service = Array.isArray(allValues.service)
        ? allValues.service[0]
        : allValues.service
    }
    if (allValues.env) filters.env = allValues.env
    onFilterChange(filters)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          <span>高级过滤</span>
        </Space>
      }
      size="small"
      extra={
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={handleReset}
        >
          清空
        </Button>
      }
    >
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleValuesChange}
        size="small"
      >
        <Form.Item name="level" label="日志级别">
          <Select
            placeholder="选择级别"
            allowClear
            style={{ width: 120 }}
          >
            <Option value="ERROR">ERROR</Option>
            <Option value="WARN">WARN</Option>
            <Option value="INFO">INFO</Option>
            <Option value="DEBUG">DEBUG</Option>
          </Select>
        </Form.Item>

        <Form.Item name="service" label="服务名称">
          <Select
            placeholder="输入或选择服务"
            allowClear
            showSearch
            style={{ width: 200 }}
          >
            <Option value="api-gateway">api-gateway</Option>
            <Option value="user-service">user-service</Option>
            <Option value="order-service">order-service</Option>
            <Option value="payment-service">payment-service</Option>
          </Select>
        </Form.Item>

        <Form.Item name="env" label="环境">
          <Select
            placeholder="选择环境"
            allowClear
            style={{ width: 120 }}
          >
            <Option value="prod">生产环境</Option>
            <Option value="staging">预发布</Option>
            <Option value="dev">开发环境</Option>
          </Select>
        </Form.Item>
      </Form>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
        提示: 高级过滤会与搜索条件组合使用
      </div>
    </Card>
  )
}

export default FilterPanel
