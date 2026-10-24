import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

// antd 主题遵循 ui-style-guide：主色随 Sprint 19 方案 A（温润纸感）+ 大圆角
const theme = {
  token: {
    colorPrimary: '#B45B3E',
    borderRadius: 16,
    colorText: '#3A2A22',
    colorBgContainer: '#FFFDF8',
    fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
