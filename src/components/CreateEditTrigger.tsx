import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  Button,
  Card,
  CardContent,
  useTheme,
  alpha,
  Switch,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  useMediaQuery,
  Fade
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RepeatIcon from '@mui/icons-material/Repeat';
import TimerIcon from '@mui/icons-material/Timer';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import { defineCron } from '../utils/dateUtils'; // Thêm import này

const CreateEditTrigger: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Khai báo các state
  const [triggerName, setTriggerName] = useState('');
  const [triggerDescription, setTriggerDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDateTime, setStartDateTime] = useState<Dayjs | null>(dayjs());
  const [timeout, setTimeout] = useState('');
  const [timeoutStatus, setTimeoutStatus] = useState('failed');
  const [configureSLA, setConfigureSLA] = useState(false);
  const [slaTime, setSlaTime] = useState('');
  const [slaTimeUnit, setSlaTimeUnit] = useState('minutes');
  const [keepRunning, setKeepRunning] = useState(false);
  const [skipRun, setSkipRun] = useState(false);
  const [createInitialRun, setCreateInitialRun] = useState(false);
  const [runtimeVariables, setRuntimeVariables] = useState<{ uuid: string; value: string }[]>([]);
  const [newVariableUUID, setNewVariableUUID] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [customCron, setCustomCron] = useState('');
  const [cronDefinition, setCronDefinition] = useState<string>('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Xử lý logic gửi dữ liệu đến server
    console.log({ 
      triggerName, 
      triggerDescription, 
      frequency: frequency === 'custom' ? customCron : frequency, 
      startDateTime: startDateTime?.toDate(),
      timeout,
      timeoutStatus,
      configureSLA,
      slaTime,
      slaTimeUnit,
      keepRunning,
      skipRun,
      createInitialRun,
      runtimeVariables
    });
    // Sau khi xử lý xong, chuyển về trang PipelineSchedules
    navigate(`/pipelines/${id}/schedules`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const addRuntimeVariable = () => {
    if (newVariableUUID && newVariableValue) {
      setRuntimeVariables([...runtimeVariables, { uuid: newVariableUUID, value: newVariableValue }]);
      setNewVariableUUID('');
      setNewVariableValue('');
    }
  };

  const removeRuntimeVariable = (index: number) => {
    setRuntimeVariables(runtimeVariables.filter((_, i) => i !== index));
  };

  const textFieldStyle = {
    input: { color: 'white' },
    textarea: { color: 'white' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'white',
      },
      '&:hover fieldset': {
        borderColor: 'white',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'white',
      },
    },
  };

  const checkboxStyle = {
    color: 'white',
    '&.Mui-checked': {
      color: 'white',
    },
    '& .MuiSvgIcon-root': {
      fontSize: 28,
    },
    '& .MuiCheckbox-root': {
      padding: '4px',
    },
  };

  const selectStyle = {
    color: 'white', 
    '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '& .MuiSvgIcon-root': { color: 'white' }, // Thay đổi màu icon dropdown
  };

  const dateTimePickerStyle = { 
    width: '100%', 
    '& .MuiInputBase-root': { color: 'white' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '& .MuiIconButton-root': { color: 'white' }, // Thay đổi màu icon calendar
    '& .MuiSvgIcon-root': { color: 'white' }, // Thay đổi màu các icon khác (nếu có)
  };

  useEffect(() => {
    if (customCron) {
      const definition = defineCron(customCron);
      setCronDefinition(definition || 'Enter a valid cron expression (e.g., "0 0 * * *" for daily at midnight)');
    } else {
      setCronDefinition('');
    }
  }, [customCron]);

  const renderTriggerSettings = () => (
    <Fade in={true} timeout={1000}>
      <Card 
        elevation={3}
        sx={{ 
          height: '100%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 30%, ${alpha(theme.palette.secondary.main, 0.1)} 90%)`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
            <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Trigger Settings
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Trigger Name</Typography>
            <TextField
              fullWidth
              value={triggerName}
              onChange={(e) => setTriggerName(e.target.value)}
              required
              sx={textFieldStyle}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Trigger Description</Typography>
            <TextField
              fullWidth
              value={triggerDescription}
              onChange={(e) => setTriggerDescription(e.target.value)}
              multiline
              rows={3}
              sx={textFieldStyle}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>
              <RepeatIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Frequency
            </Typography>
            <FormControl fullWidth>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as string)}
                required
                sx={selectStyle}
              >
                <MenuItem value="once">Once</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="always_on">Always On</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {frequency === 'custom' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>
                Cron Expression
              </Typography>
              <TextField
                fullWidth
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="e.g. 0 0 * * *"
                sx={textFieldStyle}
              />
              <Typography variant="caption" sx={{ mt: 1, color: 'white' }}>
                {cronDefinition}
              </Typography>
            </Box>
          )}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Start Date and Time</Typography>
            <DateTimePicker
              value={startDateTime}
              onChange={(newValue) => setStartDateTime(newValue)}
              sx={dateTimePickerStyle}
            />
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const renderRunSettings = () => (
    <Fade in={true} timeout={1000}>
      <Card 
        elevation={3}
        sx={{ 
          height: '100%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)} 30%, ${alpha(theme.palette.primary.main, 0.1)} 90%)`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
            <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Run Settings
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Set a timeout for each run of this trigger (optional)</Typography>
            <TextField
              fullWidth
              value={timeout}
              onChange={(e) => setTimeout(e.target.value)}
              sx={textFieldStyle}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Status for runs that exceed the timeout</Typography>
            <FormControl fullWidth>
              <Select
                value={timeoutStatus}
                onChange={(e) => setTimeoutStatus(e.target.value as string)}
                sx={selectStyle}
              >
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="timeout">Timeout</MenuItem>
                <MenuItem value="cancel">Cancel</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <FormControlLabel
            control={<Switch checked={configureSLA} onChange={(e) => setConfigureSLA(e.target.checked)} />}
            label={<Typography color="white">Configure trigger SLA</Typography>}
            sx={{ mb: 3 }}
          />
          {configureSLA && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>SLA Time</Typography>
                <TextField
                  fullWidth
                  value={slaTime}
                  onChange={(e) => setSlaTime(e.target.value)}
                  sx={textFieldStyle}
                />
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Time Unit</Typography>
                <FormControl fullWidth>
                  <Select
                    value={slaTimeUnit}
                    onChange={(e) => setSlaTimeUnit(e.target.value as string)}
                    sx={selectStyle}
                  >
                    <MenuItem value="minutes">Minutes</MenuItem>
                    <MenuItem value="hours">Hours</MenuItem>
                    <MenuItem value="days">Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
          <FormControlLabel
            control={
              <Checkbox 
                checked={keepRunning} 
                onChange={(e) => setKeepRunning(e.target.checked)}
                sx={checkboxStyle}
              />
            }
            label="Keep running pipeline even if blocks fail"
            sx={{ display: 'block', mb: 2, color: 'white' }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={skipRun} 
                onChange={(e) => setSkipRun(e.target.checked)}
                sx={checkboxStyle}
              />
            }
            label="Skip run if previous run still in progress"
            sx={{ display: 'block', mb: 2, color: 'white' }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={createInitialRun} 
                onChange={(e) => setCreateInitialRun(e.target.checked)}
                sx={checkboxStyle}
              />
            }
            label="Create initial pipeline run if start date is before current execution period"
            sx={{ display: 'block', mb: 3, color: 'white' }}
          />
          <Divider sx={{ my: 3, bgcolor: 'white' }} />
          <Typography variant="subtitle1" sx={{ mb: 3, color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1, color: 'white' }} />
            Runtime Variables
          </Typography>
          {runtimeVariables.map((variable, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Variable UUID</Typography>
                <TextField
                  fullWidth
                  value={variable.uuid}
                  disabled
                  sx={{ 
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'white',
                    },
                    textFieldStyle
                  }}
                />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>Value</Typography>
                <TextField
                  fullWidth
                  value={variable.value}
                  disabled
                  sx={{ 
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'white',
                    },
                    textFieldStyle
                  }}
                />
              </Box>
              <IconButton 
                onClick={() => removeRuntimeVariable(index)}
                sx={{ color: 'white', mb: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>New Variable UUID</Typography>
              <TextField
                fullWidth
                value={newVariableUUID}
                onChange={(e) => setNewVariableUUID(e.target.value)}
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ mb: 1, color: 'white' }}>New Variable Value</Typography>
              <TextField
                fullWidth
                value={newVariableValue}
                onChange={(e) => setNewVariableValue(e.target.value)}
                sx={textFieldStyle}
              />
            </Box>
            <IconButton 
              onClick={addRuntimeVariable}
              disabled={!newVariableUUID || !newVariableValue}
              sx={{ color: 'white', mb: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ 
        p: 3, 
        height: '100%', 
        overflow: 'auto',
        // background: `linear-gradient(120deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ color: 'white' }}>
            Back
          </Button>
          <Typography variant="h5" component="h1" sx={{ ml: 2, flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
            Create/Edit Trigger
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
              }
            }}
          >
            Save Trigger
          </Button>
        </Box>
        <Grid container spacing={4} direction={isSmallScreen ? 'column' : 'row'}>
          <Grid component="div"  sx={{ xs: 12, md: 6, height: '100%'}}
          size={{xs:12, sm:6, md:6, lg:6}}>
            {renderTriggerSettings()}
          </Grid>
          <Grid component="div" sx={{ xs: 12, md: 6, height: '100%' }} size={{xs:12, sm:6, md:6, lg:6}}>
            {renderRunSettings()}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateEditTrigger;
