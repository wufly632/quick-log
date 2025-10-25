import React from 'react'
import { Layout } from 'antd'
import SearchPage from './pages/Search'

const { Header, Content } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#001529',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <h1 style={{
          color: 'white',
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          📊 日志检索平台
        </h1>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <SearchPage />
      </Content>
    </Layout>
  )
}

export default App
