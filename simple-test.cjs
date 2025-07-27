#!/usr/bin/env node

// 简单的MCP客户端测试
const { spawn } = require('child_process');
const readline = require('readline');

async function testMCPServer() {
  console.log('🚀 启动MCP服务器功能测试...\n');

  // 启动MCP服务器
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const rl = readline.createInterface({
    input: serverProcess.stdout,
    output: process.stdout
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('📋 测试工具列表请求...');
  
  // 发送工具列表请求
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };

  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // 监听响应
  serverProcess.stdout.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
      console.log('📥 服务器响应:', response);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('🔍 服务器日志:', data.toString());
  });

  // 等待一段时间后测试OCR
  setTimeout(() => {
    console.log('\n🔍 测试OCR识别...');
    
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const ocrRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'ocr_recognize',
        arguments: {
          image: testImageBase64,
          language: 'eng'
        }
      }
    };

    serverProcess.stdin.write(JSON.stringify(ocrRequest) + '\n');
  }, 3000);

  // 5秒后关闭测试
  setTimeout(() => {
    console.log('\n✅ 测试完成，关闭服务器...');
    serverProcess.kill();
    process.exit(0);
  }, 8000);
}

testMCPServer().catch(console.error);
