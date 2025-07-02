import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
// 尝试正确的CSS导入，如果使用antd 5.x，则使用下面的导入
// import 'antd/dist/reset.css';
// 如果使用antd 4.x，则使用下面的导入
import 'antd/dist/reset.css';
import './App.css';

import Navbar from './components/Navbar';
import MainWorkflow from './components/MainWorkflow';
import { WorkflowProvider } from './components/WorkflowContext';
import LoginPage from './pages/LoginPage';
import LandmarksPage from './pages/LandmarksPage';
import PlanGeneratorPage from './pages/PlanGeneratorPage';
import TeacherInputPage from './pages/TeacherInputPage';
import RoutePlansPage from './pages/RoutePlansPage';
import NotesPage from './pages/NotesPage';
import Footer from './components/Footer';
import SimpleNewPage from './pages/SimpleNewPage';
import SimpleAiTestPage from './pages/SimpleAiTestPage';
import SpeechTestPage from './pages/SpeechTestPage';
import ProxyTestPage from './pages/ProxyTestPage';
import ApiTestPage from './pages/ApiTestPage';
import BackendTestPage from './pages/BackendTestPage';

const { Content } = Layout;

function App() {
  return (
    <WorkflowProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SimpleNewPage />} />
          <Route path="/workflow" element={<MainWorkflow />} />
          {/* 主工作流页面作为首页 */}

        {/* 独立页面路由，用于传统访问方式 */}
        <Route path="/login" element={
          <Layout className="app-container">
            <Navbar />
            <Content><LoginPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/landmarks" element={
          <Layout className="app-container">
            <Navbar />
            <Content><LandmarksPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/plan-generator" element={
          <Layout className="app-container">
            <Navbar />
            <Content><PlanGeneratorPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/teacher-input" element={
          <Layout className="app-container">
            <Navbar />
            <Content><TeacherInputPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/routes" element={
          <Layout className="app-container">
            <Navbar />
            <Content><RoutePlansPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/notes" element={
          <Layout className="app-container">
            <Navbar />
            <Content><NotesPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/study-plans/:id" element={
          <Layout className="app-container">
            <Navbar />
            <Content><RoutePlansPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/route-plans/:id" element={
          <Layout className="app-container">
            <Navbar />
            <Content><RoutePlansPage /></Content>
            <Footer />
          </Layout>
        } />
        <Route path="/new" element={<SimpleNewPage />} />
        <Route path="/ai-test" element={<SimpleAiTestPage />} />
        <Route path="/speech-test" element={<SpeechTestPage />} />
        <Route path="/proxy-test" element={<ProxyTestPage />} />
        <Route path="/api-test" element={<ApiTestPage />} />
        <Route path="/backend-test" element={<BackendTestPage />} />
              </Routes>
      </Router>
    </WorkflowProvider>
  );
}

export default App;
