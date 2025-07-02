import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';

const { Header } = Layout;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [current, setCurrent] = useState(location.pathname || '/');

  const handleClick = (path: string) => {
    setCurrent(path);
    navigate(path);
  };

  const menuItems = [
    { key: '/', label: '首页' },
    { key: '/teacher-input', label: '教学要求' },
    { key: '/courses', label: '课程规划' },
    { key: '/routes', label: '路线设计' },
    { key: '/notes', label: '艺术笔记' },
    { key: '/landmarks', label: '景点展示' },
    { key: '/plan-generator', label: '计划生成器' },
  ];

  return (
    <Header className="navbar">
      <div className="logo">都市客厅研学助手</div>
      <div className="menu">
        {menuItems.map(item => (
          <div 
            key={item.key}
            className={`menu-item ${current === item.key ? 'active' : ''}`}
            onClick={() => handleClick(item.key)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </Header>
  );
};

export default Navbar; 