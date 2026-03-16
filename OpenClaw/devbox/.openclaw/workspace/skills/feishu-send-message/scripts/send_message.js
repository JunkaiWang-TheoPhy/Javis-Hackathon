#!/usr/bin/env node

/**
 * 飞书消息发送脚本
 * 用法: node send_message.js <receive_id> <message_text> [image_path]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 从配置文件读取飞书配置
function getFeishuConfig() {
  const configPath = path.join(process.env.HOME, '.openclaw/openclaw.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const feishuConfig = config.channels?.feishu?.accounts?.main;
  if (!feishuConfig) {
    throw new Error('未找到飞书配置');
  }
  
  return {
    appId: feishuConfig.appId,
    appSecret: feishuConfig.appSecret
  };
}

// 获取 tenant_access_token
function getTenantAccessToken(appId, appSecret) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.tenant_access_token);
          } else {
            reject(new Error(`获取token失败: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 上传图片
function uploadImage(token, imagePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const imageData = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    
    const formData = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="image_type"`,
      '',
      'message',
      `--${boundary}`,
      `Content-Disposition: form-data; name="image"; filename="${fileName}"`,
      'Content-Type: image/jpeg',
      '',
      imageData.toString('binary'),
      `--${boundary}--`
    ].join('\r\n');

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/im/v1/images',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData, 'binary')
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data.image_key);
          } else {
            reject(new Error(`上传图片失败: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(formData, 'binary');
    req.end();
  });
}

// 发送文本消息
function sendTextMessage(token, receiveId, text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      receive_id: receiveId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(`发送消息失败: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 发送图片消息
function sendImageMessage(token, receiveId, imageKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      receive_id: receiveId,
      msg_type: 'image',
      content: JSON.stringify({ image_key: imageKey })
    });

    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(`发送图片失败: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('用法: node send_message.js <receive_id> <message_text> [image_path]');
    process.exit(1);
  }

  const receiveId = args[0];
  const messageText = args[1];
  const imagePath = args[2];

  try {
    const config = getFeishuConfig();
    const token = await getTenantAccessToken(config.appId, config.appSecret);
    
    // 发送文本消息
    if (messageText) {
      const textResult = await sendTextMessage(token, receiveId, messageText);
      console.log('文本消息发送成功:', textResult.message_id);
    }
    
    // 如果有图片，上传并发送
    if (imagePath && fs.existsSync(imagePath)) {
      const imageKey = await uploadImage(token, imagePath);
      const imageResult = await sendImageMessage(token, receiveId, imageKey);
      console.log('图片消息发送成功:', imageResult.message_id);
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
