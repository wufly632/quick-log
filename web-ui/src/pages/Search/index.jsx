import React, { useState } from 'react'
import { Card, Space, message, Statistic, Row, Col } from 'antd'
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import SearchBar from '../../components/SearchBar'
import FilterPanel from '../../components/FilterPanel'
import LogTable from '../../components/LogTable'
import { searchLogs } from '../../api/search'

const SearchPage = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [tookMs, setTookMs] = useState(0)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  })

  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    query: '*',
    filters: {},
    time_range_type: 'relative',
    relative_time_key: '15m',
  })

  // 执行搜索
  const handleSearch = async (params) => {
    setLoading(true)
    try {
      // 构建 API 请求参数
      const apiParams = {
        query: params.query || searchParams.query,
        filters: params.filters || searchParams.filters,
        page: params.page || pagination.current,
        page_size: params.page_size || pagination.pageSize,
        sort_by: 'timestamp',
        sort_desc: true,
      }

      // 处理时间范围参数
      if (params.time_range_type === 'relative') {
        // 相对时间：传 key 给后端
        apiParams.time_range_type = 'relative'
        apiParams.relative_time_key = params.relative_time_key
        console.log('API request with relative time:', apiParams) // 调试
      } else if (params.time_range_type === 'absolute') {
        // 绝对时间：传时间戳给后端
        apiParams.time_range_type = 'absolute'
        apiParams.start_time = params.start_time || searchParams.start_time
        apiParams.end_time = params.end_time || searchParams.end_time
        console.log('API request with absolute time:', apiParams) // 调试
      } else {
        // 保持兼容性：如果有 start_time/end_time，使用绝对时间格式
        apiParams.time_range_type = 'absolute'
        apiParams.start_time = params.start_time || searchParams.start_time
        apiParams.end_time = params.end_time || searchParams.end_time
      }

      const result = await searchLogs(apiParams)

      setData(result.hits || [])
      setTotal(result.total || 0)
      setTookMs(result.took_ms || 0)
      setPagination({
        ...pagination,
        current: result.page || 1,
        pageSize: result.page_size || 50,
        total: result.total || 0,
      })

      // 更新搜索参数
      const newSearchParams = {
        query: params.query || searchParams.query,
        filters: params.filters || searchParams.filters,
      }

      // 保存时间范围参数
      if (params.time_range_type === 'relative') {
        newSearchParams.time_range_type = 'relative'
        newSearchParams.relative_time_key = params.relative_time_key
      } else {
        newSearchParams.time_range_type = 'absolute'
        newSearchParams.start_time = params.start_time || searchParams.start_time
        newSearchParams.end_time = params.end_time || searchParams.end_time
      }

      setSearchParams(newSearchParams)
    } catch (error) {
      message.error(`搜索失败: ${error.message}`)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 搜索栏搜索
  const handleSearchBarSearch = (params) => {
    console.log('SearchBar params:', params) // 调试

    // 处理新的时间范围格式
    let searchData = {
      ...params,
      page: 1, // 重置到第一页
    }

    // 如果是相对时间，直接传递给后端处理
    // 如果是绝对时间，转换为 start_time 和 end_time
    if (params.time_range_type === 'absolute') {
      searchData = {
        query: params.query,
        start_time: params.start_time,
        end_time: params.end_time,
        page: 1,
      }
    }
    // 相对时间保持原样，后端会处理 time_range_type 和 relative_time_key

    console.log('Final search data:', searchData) // 调试
    handleSearch(searchData)
  }

  // 过滤器变化
  const handleFilterChange = (filters) => {
    handleSearch({
      filters,
      page: 1, // 重置到第一页
      // 保留当前的时间范围参数
      time_range_type: searchParams.time_range_type,
      relative_time_key: searchParams.relative_time_key,
      start_time: searchParams.start_time,
      end_time: searchParams.end_time,
    })
  }

  // 重置过滤器
  const handleFilterReset = () => {
    handleSearch({
      filters: {},
      page: 1,
      // 保留当前的时间范围参数
      time_range_type: searchParams.time_range_type,
      relative_time_key: searchParams.relative_time_key,
      start_time: searchParams.start_time,
      end_time: searchParams.end_time,
    })
  }

  // 表格变化（分页、排序、过滤）
  const handleTableChange = (pag) => {
    handleSearch({
      page: pag.current,
      page_size: pag.pageSize,
      // 保留当前的时间范围参数
      time_range_type: searchParams.time_range_type,
      relative_time_key: searchParams.relative_time_key,
      start_time: searchParams.start_time,
      end_time: searchParams.end_time,
    })
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* 搜索栏 */}
      <Card>
        <SearchBar onSearch={handleSearchBarSearch} loading={loading} />
      </Card>

      {/* 过滤面板 */}
      <FilterPanel
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* 统计信息 */}
      {total > 0 && (
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <Statistic
                title="搜索结果"
                value={total}
                prefix={<FileTextOutlined />}
                suffix="条"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="查询耗时"
                value={tookMs}
                prefix={<ClockCircleOutlined />}
                suffix="ms"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 日志表格 */}
      <Card>
        <LogTable
          data={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </Space>
  )
}

export default SearchPage
