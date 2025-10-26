import React from 'react'
import { Card, Form, Select, Space, Button, Divider, message } from 'antd'
import { FilterOutlined, ClearOutlined } from '@ant-design/icons'
import { getServices } from '../../api/search'

const { Option } = Select

const FilterPanel = ({ onFilterChange, onReset }) => {
  const [form] = Form.useForm()
  const [serviceOptions, setServiceOptions] = React.useState([])
  const [serviceLoading, setServiceLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchServices = async () => {
      setServiceLoading(true)
      try {
        const response = await getServices()
        const services = Array.isArray(response.services) ? response.services : []
        setServiceOptions(services)
      } catch (error) {
        message.error(`加载服务列表失败: ${error.message}`)
      } finally {
        setServiceLoading(false)
      }
    }

    fetchServices()
  }, [])

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
            loading={serviceLoading}
            notFoundContent={serviceLoading ? '加载中...' : undefined}
          >
            {serviceOptions.map((service) => (
              <Option key={service} value={service}>
                {service}
              </Option>
            ))}
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
