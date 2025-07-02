import React from 'react';
import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  return (
    <AntFooter className="footer">
      都市客厅研学助手 ©{new Date().getFullYear()}
    </AntFooter>
  );
};

export default Footer; 