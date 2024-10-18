import React, { useState, useEffect } from 'react';
import { Card, Typography,  Row, Col, Tag, message, Input, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';
import { fetchPipelines } from '../services/api';
import { useHeader } from '../contexts/HeaderContext';
import { motion } from 'framer-motion';

const { Paragraph } = Typography;
const { Meta } = Card;

interface Pipeline {
  uuid: string;
  name: string;
  description?: string;
  status?: string;
  tags?: string[];
}

const Pipelines: React.FC = () => {
  const { setTitle, setShowBackButton } = useHeader();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setTitle('Pipelines');
    setShowBackButton(false);
    const loadPipelines = async () => {
      try {
        const data = await fetchPipelines();
        if (data && Array.isArray(data.pipelines)) {
          setPipelines(data.pipelines);
          setFilteredPipelines(data.pipelines);
        } else {
          message.error('Failed to load pipelines. Unexpected data structure.');
        }
        setLoading(false);
      } catch (err) {
        message.error('Failed to load pipelines. Please try again later.');
        setLoading(false);
      }
    };

    loadPipelines();
  }, [setTitle, setShowBackButton]);

  useEffect(() => {
    const filtered = pipelines.filter(pipeline => 
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPipelines(filtered);
  }, [searchTerm, pipelines]);

  const handlePipelineClick = (pipelineId: string) => {
    navigate(`/pipelines/${pipelineId}/schedules`);
  };

  const renderSkeletons = () => {
    return Array(8).fill(null).map((_, index) => (
      <Col xs={24} sm={12} md={8} lg={6} key={`skeleton-${index}`}>
        <Card style={{ height: 160, overflow: 'hidden' }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      </Col>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input
          placeholder="Search pipelines"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Row gutter={[16, 16]}>
        {loading ? (
          renderSkeletons()
        ) : filteredPipelines.length > 0 ? (
          filteredPipelines.map((pipeline) => (
            <Col xs={24} sm={12} md={8} lg={6} key={pipeline.uuid}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  hoverable
                  onClick={() => handlePipelineClick(pipeline.uuid)}
                  style={{ height: 160, overflow: 'hidden' }}
                >
                  <Meta
                    title={pipeline.name}
                    description={
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {pipeline.description || 'No description available'}
                      </Paragraph>
                    }
                  />
                  {pipeline.status && (
                    <div style={{ marginTop: '10px' }}>
                      <Tag color={pipeline.status === 'active' ? 'green' : 'default'}>
                        {pipeline.status}
                      </Tag>
                    </div>
                  )}
                  {pipeline.tags && pipeline.tags.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {pipeline.tags.map((tag, index) => (
                        <Tag key={index} color="blue">{tag}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Typography.Text>No pipelines found.</Typography.Text>
          </Col>
        )}
      </Row>
    </motion.div>
  );
};

export default Pipelines;
