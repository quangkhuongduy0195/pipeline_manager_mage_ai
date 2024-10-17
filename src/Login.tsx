import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Box, Typography, Container, CssBaseline, CircularProgress, Paper, IconButton, InputAdornment } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { login } from './services/api';
import bgImage from './assets/bg.png';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { saveToken } from './services/tokenManager';
import { isTokenValid } from './services/tokenManager';

type LoginInputs = {
  email: string;
  password: string;
};

type ErrorResponse = {
  error: {
    code: number;
    message: string;
    type: string;
  };
};

type SuccessResponse = {
  session: {
    expires: string;
    token: string;
    user: {
      id: number;
      username: string;
      // ... other user properties
    };
  };
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (isTokenValid()) {
      navigate('/pipelines');
    }
  }, [navigate]);

  const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setIsLoading(true);
    try {
      const response = await login(data.email, data.password);
      
      if ('error' in response) {
        const errorResponse = response as ErrorResponse;
        toast.error(errorResponse.error.message);
      } else {
        const successResponse = response as SuccessResponse;
        console.log('Đăng nhập thành công:', successResponse);
        toast.success('Đăng nhập thành công!');
        
        // Sử dụng saveToken để lưu token và thời gian hết hạn
        saveToken(successResponse.session.token, successResponse.session.expires);
        
        setTimeout(() => {
          navigate('/pipelines');
        }, 1500);
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={6}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
              Đăng nhập
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Địa chỉ email"
                autoComplete="email"
                autoFocus
                {...register('email', { 
                  required: 'Email là bắt buộc', 
                  pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' } 
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                {...register('password', { 
                  required: 'Mật khẩu là bắt buộc', 
                  minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' } 
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
};

export default Login;
