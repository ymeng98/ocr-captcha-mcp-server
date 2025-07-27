const { spawn } = require('child_process');
const path = require('path');

async function testMCPProtocol() {
  console.log('🚀 测试MCP协议通信...\n');

  // 直接运行编译后的JavaScript文件
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseCount = 0;

  // 监听服务器输出
  serverProcess.stdout.on('data', (data) => {
    const response = data.toString().trim();
    if (response && response.startsWith('{')) {
      try {
        const parsed = JSON.parse(response);
        console.log(`📥 响应 ${++responseCount}:`, JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('📥 原始响应:', response);
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('🔍 服务器状态:', data.toString().trim());
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('📋 发送初始化请求...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // 等待初始化响应后发送工具列表请求
  setTimeout(() => {
    console.log('\n📋 发送工具列表请求...');
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }, 2000);

  // 测试OCR功能
  setTimeout(() => {
    console.log('\n🔍 测试OCR识别功能...');
    
    // 简单的测试图片base64
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const ocrRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'ocr_recognize',
        arguments: {
          image: testImage,
          language: 'eng'
        }
      }
    };

    serverProcess.stdin.write(JSON.stringify(ocrRequest) + '\n');
  }, 4000);

  // 6秒后结束测试
  setTimeout(() => {
    console.log('\n✅ 测试完成！');
    serverProcess.kill();
    process.exit(0);
  }, 10000);

  // 处理进程错误
  serverProcess.on('error', (error) => {
    console.error('❌ 服务器进程错误:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`🏁 服务器进程退出，代码: ${code}`);
  });
}

testMCPProtocol().catch(console.error);
