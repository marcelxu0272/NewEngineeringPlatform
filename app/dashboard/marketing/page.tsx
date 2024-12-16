'use client';

import { Layout, Row, Col, Card, Radio, DatePicker, Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { Content } = Layout;

export default function MarketingDashboard() {
  return (
    <Layout>
      {/* 顶部功能区 */}
      <Row justify="space-between" align="middle" style={{ padding: '16px' }}>
        <Col>
          <Radio.Group defaultValue="withEPC">
            <Radio.Button value="withEPC">包含EPC</Radio.Button>
            <Radio.Button value="withoutEPC">不包含EPC</Radio.Button>
          </Radio.Group>
        </Col>
        <Col>
          <Space>
            <span>统计截至日期:</span>
            <DatePicker />
            <Button type="primary" icon={<DownloadOutlined />}>
              导出
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 内容区 */}
      <Content style={{ padding: '16px' }}>
        <Row gutter={[16, 16]}>
          {/* 第一列 - 3个等高模块 */}
          <Col span={6}>
            <Card style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
              模块1
            </Card>
            <Card style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
              模块2
            </Card>
            <Card style={{ height: 'calc(33.33vh - 32px)' }}>
              模块3
            </Card>
          </Col>

          {/* 第二、三列 - 上面大模块，下面一个模块 */}
          <Col span={12}>
            <Card style={{ marginBottom: '16px', height: 'calc(66.66vh - 48px)' }}>
              模块4（占两列两行）
            </Card>
            <Card style={{ height: 'calc(33.33vh - 32px)' }}>
              模块5（占两列一行）
            </Card>
          </Col>

          {/* 第四列 - 3个等高模块 */}
          <Col span={6}>
            <Card style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
              模块6
            </Card>
            <Card style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
              模块7
            </Card>
            <Card style={{ height: 'calc(33.33vh - 32px)' }}>
              模块8
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
