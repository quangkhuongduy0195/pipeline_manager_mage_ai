import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Checkbox, 
  DatePicker, 
  Space, 
  Card, 
  Divider, 
  Row, 
  Col,
  message,
  Skeleton,
  Alert
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchPipelineSchedules, createPipelineSchedule, updatePipelineSchedule, fetchPipelineVariables } from '../services/api';
import { defineCron } from '../utils/dateUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useHeader } from '../contexts/HeaderContext';
import { motion, AnimatePresence } from 'framer-motion';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface RuntimeVariable {
  uuid: string;
  value: string;
}

interface PipelineVariable {
  uuid: string;
  type: string;
  value: string;
}

interface VariableGroup {
  block: {
    uuid: string;
  };
  pipeline: {
    uuid: string;
  };
  variables: PipelineVariable[];
}

const isCronExpression = (value: string) => {
  // Simple regex to check if the value looks like a cron expression
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(value);
};

const CreateEditTrigger: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id: pipelineId, scheduleId } = useParams<{ id?: string; scheduleId?: string }>();
  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState('');
  const [configureSLA, setConfigureSLA] = useState(false);
  const [runtimeVariables, setRuntimeVariables] = useState<RuntimeVariable[]>([]);
  const { setTitle, setShowBackButton } = useHeader();
  const [cronDefinition, setCronDefinition] = useState('');
  const [isCronValid, setIsCronValid] = useState(true);

  useEffect(() => {
    setTitle(scheduleId ? 'Edit Trigger' : 'Create Trigger');
    setShowBackButton(true);
    const loadData = async () => {
      if (pipelineId) {
        try {
          const [scheduleData, variablesData] = await Promise.all([
            scheduleId ? fetchPipelineSchedules(pipelineId) : Promise.resolve(null),
            fetchPipelineVariables(pipelineId)
          ]);

          if (scheduleData) {
            const schedule = scheduleData.pipeline_schedules.find((s: any) => s.id === parseInt(scheduleId!));
            if (schedule) {
              const scheduleInterval = schedule.schedule_interval;
              const isCustomCron = isCronExpression(scheduleInterval);
              form.setFieldsValue({
                triggerName: schedule.name,
                triggerDescription: schedule.description,
                frequency: isCustomCron ? 'custom' : scheduleInterval,
                customCron: isCustomCron ? scheduleInterval : undefined,
                startDateTime: dayjs.utc(schedule.start_time).local(),
                timeout: schedule.timeout,
                timeoutStatus: schedule.timeout_status,
                slaTime: schedule.sla_time,
                slaTimeUnit: schedule.sla_time_unit,
                keepRunning: schedule.keep_running,
                skipRun: schedule.skip_run,
                createInitialRun: schedule.create_initial_run,
              });
              setFrequency(isCustomCron ? 'custom' : scheduleInterval);
              setConfigureSLA(!!schedule.sla_time);
              setRuntimeVariables(schedule.runtime_variables || []);
            }
          }

          // Xử lý dữ liệu variables
          if (variablesData && variablesData.variables) {
            const relevantVariableGroup = variablesData.variables.find(
              (group: VariableGroup) => group.pipeline.uuid === pipelineId && group.block.uuid === "global"
            );
            if (relevantVariableGroup) {
              // Khởi tạo runtime variables từ pipeline variables
              setRuntimeVariables(relevantVariableGroup.variables.map((v:any) => ({ uuid: v.uuid, value: v.value || '' })));
            }
          }
        } catch (err) {
          message.error('Failed to load data. Please try again.');
        }
      }
      setLoading(false);
    };

    loadData();
  }, [pipelineId, scheduleId, form, setTitle, setShowBackButton]);

  const onFinish = async (values: any) => {
    try {
      const scheduleData = {
        name: values.triggerName,
        start_time: values.startDateTime.utc().format(),
        description: values.triggerDescription, 
        schedule_type: 'time',
        schedule_interval: values.frequency === 'custom' ? values.customCron : values.frequency,
        sla: values.slaTimeUnit === 'seconds' ? values.slaTime :
            values.slaTimeUnit === 'minutes' ? values.slaTime * 60 :
            values.slaTimeUnit === 'hours' ? values.slaTime * 3600 :
            values.slaTimeUnit === 'days' ? values.slaTime * 86400 :
            values.slaTime,
        settings: {
          timeout: values.timeout,
          timeout_status: values.timeoutStatus,
          allow_blocks_to_fail: values.keepRunning,
          skip_if_previous_running: values.skipRun,
          create_initial_pipeline_run: values.createInitialRun, 
        },
        variables: runtimeVariables,
      };

      if (scheduleId) {
        await updatePipelineSchedule(scheduleId, scheduleData);
        message.success('Trigger updated successfully');
      } else {
        if (!pipelineId) {
          throw new Error('Pipeline ID is missing');
        }
        const newScheduleId = await createPipelineSchedule(pipelineId, scheduleData.name);
        if (newScheduleId) {
          await updatePipelineSchedule(newScheduleId, scheduleData);
          message.success('Trigger created successfully');
        } else {
          message.error('Failed to create trigger. Please try again.');
        }
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving trigger:', error);
      message.error('Failed to save trigger. Please try again.');
    }
  };

  const updateRuntimeVariable = (index: number, field: 'uuid' | 'value', value: string) => {
    const updatedVariables = [...runtimeVariables];
    updatedVariables[index][field] = value;
    setRuntimeVariables(updatedVariables);
  };

  const removeRuntimeVariable = (index: number) => {
    const updatedVariables = runtimeVariables.filter((_, i) => i !== index);
    setRuntimeVariables(updatedVariables);
  };

  const addRuntimeVariable = () => {
    setRuntimeVariables([...runtimeVariables, { uuid: '', value: '' }]);
  };

  const handleCronExpressionChange = (value: string) => {
    setCronDefinition(defineCron(value));
    setIsCronValid(true);
  };

  const renderSkeletons = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Card title="Trigger Settings" style={{ height: '100%' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Col>
      <Col span={12}>
        <Card title="Run Settings" style={{ height: '100%' }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
    </Row>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {renderSkeletons()}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          frequency: 'once',
          timeoutStatus: 'failed',
          slaTimeUnit: 'minutes',
          startDateTime: dayjs(),
        }}
      >
        <Space direction="vertical" size="middle" style={{ display: 'flex', width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card title="Trigger Settings" style={{ height: '100%' }}>
                  <Form.Item name="triggerName" label="Trigger Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="triggerDescription" label="Trigger Description">
                    <TextArea rows={4} />
                  </Form.Item>
                  <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
                    <Select onChange={(value) => setFrequency(value)}>
                      <Option value="@once">Once</Option>
                      <Option value="@hourly">Hourly</Option>
                      <Option value="@daily">Daily</Option>
                      <Option value="@weekly">Weekly</Option>
                      <Option value="@monthly">Monthly</Option>
                      <Option value="@always_on">Always On</Option>
                      <Option value="custom">Custom</Option>
                    </Select>
                  </Form.Item>
                  <AnimatePresence>
                    {frequency === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Form.Item
                          name="customCron"
                          label="Cron Expression"
                          rules={[
                            { required: true, message: 'Please input the cron expression!' },
                            { 
                              validator: (_, value) => 
                                isCronExpression(value) 
                                  ? Promise.resolve() 
                                  : Promise.reject('Invalid cron expression')
                            }
                          ]}
                          help={!isCronValid && "Invalid cron expression format"}
                          validateStatus={!isCronValid ? "error" : ""}
                        >
                          <Input
                            placeholder="e.g. 0 0 * * *"
                            onChange={(e) => handleCronExpressionChange(e.target.value)}
                          />
                        </Form.Item>
                        {cronDefinition && (
                          <Alert
                            message="Cron Definition"
                            description={cronDefinition}
                            type="info"
                            showIcon
                            style={{ marginBottom: 8 }}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Form.Item name="startDateTime" label="Start Date and Time" rules={[{ required: true }]}>
                    <DatePicker 
                      showTime 
                      style={{ width: '100%' }} 
                      format="YYYY-MM-DD HH:mm:ss"
                    />
                  </Form.Item>
                </Card>
              </motion.div>
            </Col>
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card title="Run Settings" style={{ height: '100%' }}>
                  <Form.Item name="timeout" label="Timeout for each run (optional)">
                    <Input />
                  </Form.Item>
                  <Form.Item name="timeoutStatus" label="Status for runs that exceed the timeout">
                    <Select>
                      <Option value="failed">Failed</Option>
                      <Option value="timeout">Timeout</Option>
                      <Option value="cancel">Cancel</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="configureSLA" label="Configure trigger SLA" valuePropName="checked">
                    <Switch onChange={(checked) => setConfigureSLA(checked)} />
                  </Form.Item>
                  <AnimatePresence>
                    {configureSLA && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Space style={{ display: 'flex' }}>
                          <Form.Item name="slaTime" label="SLA Time" rules={[{ required: true }]}>
                            <Input style={{ width: 100 }} />
                          </Form.Item>
                          <Form.Item name="slaTimeUnit" label="Time Unit" rules={[{ required: true }]}>
                            <Select style={{ width: 100 }}>
                              <Option value="minutes">Minutes</Option>
                              <Option value="hours">Hours</Option>
                              <Option value="days">Days</Option>
                            </Select>
                          </Form.Item>
                        </Space>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Form.Item name="keepRunning" valuePropName="checked">
                    <Checkbox>Keep running pipeline even if blocks fail</Checkbox>
                  </Form.Item>
                  <Form.Item name="skipRun" valuePropName="checked">
                    <Checkbox>Skip run if previous run still in progress</Checkbox>
                  </Form.Item>
                  <Form.Item name="createInitialRun" valuePropName="checked">
                    <Checkbox>Create initial pipeline run if start date is before current execution period</Checkbox>
                  </Form.Item>
                  
                  <Divider />
                  
                  <Title level={5}>Runtime Variables</Title>
                  <AnimatePresence>
                    {runtimeVariables.map((variable, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Input
                            placeholder="Variable UUID"
                            value={variable.uuid}
                            onChange={(e) => updateRuntimeVariable(index, 'uuid', e.target.value)}
                            style={{ width: 200 }}
                          />
                          <Input
                            placeholder="Value"
                            value={variable.value}
                            onChange={(e) => updateRuntimeVariable(index, 'value', e.target.value)}
                            style={{ width: 200 }}
                          />
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeRuntimeVariable(index)}
                          />
                        </Space>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button type="dashed" onClick={addRuntimeVariable} block icon={<PlusOutlined />}>
                    Add Runtime Variable
                  </Button>
                </Card>
              </motion.div>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {scheduleId ? 'Update Trigger' : 'Create Trigger'}
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </motion.div>
  );
};

export default CreateEditTrigger;
