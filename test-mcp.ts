import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function testMCPServer() {
  console.log('🚀 启动MCP服务器测试...\n');

  // 启动MCP服务器进程
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // 创建MCP客户端
  const transport = new StdioClientTransport({
    command: 'npm',
    args: ['run', 'dev'],
    cwd: process.cwd()
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // 连接到服务器
    await client.connect(transport);
    console.log('✅ 成功连接到MCP服务器');

    // 测试工具列表
    console.log('\n📋 获取可用工具列表...');
    const tools = await client.request(
      { method: 'tools/list' },
      {}
    );
    
    console.log(`找到 ${tools.tools.length} 个工具:`);
    tools.tools.forEach((tool: any, index: number) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // 测试OCR功能
    console.log('\n🔍 测试OCR识别功能...');
    
    // 创建一个简单的测试图片 (1x1像素白色PNG的base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    try {
      const ocrResult = await client.request(
        { method: 'tools/call' },
        {
          name: 'ocr_recognize',
          arguments: {
            image: testImageBase64,
            language: 'eng'
          }
        }
      );
      
      console.log('✅ OCR测试成功:');
      console.log(ocrResult.content[0].text);
    } catch (error) {
      console.log('❌ OCR测试失败:', error);
    }

    // 测试图像预处理功能
    console.log('\n🎨 测试图像预处理功能...');
    try {
      const preprocessResult = await client.request(
        { method: 'tools/call' },
        {
          name: 'image_preprocessing',
          arguments: {
            image: testImageBase64,
            operations: ['grayscale', 'contrast']
          }
        }
      );
      
      console.log('✅ 图像预处理测试成功');
      console.log('处理结果长度:', preprocessResult.content[0].text.length);
    } catch (error) {
      console.log('❌ 图像预处理测试失败:', error);
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理资源
    try {
      await client.close();
      serverProcess.kill();
    } catch (error) {
      console.error('清理资源时发生错误:', error);
    }
  }
}

// 运行测试
testMCPServer().catch(console.error);
