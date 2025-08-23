# 飞书API服务

本目录包含飞书开放平台API的封装服务。

## 文件说明

- `feishu-api.ts` - 原有的飞书API服务（基于fetch）
- `feishu-request.ts` - 新的飞书API请求封装（基于axios，使用tenant_access_token）

## feishu-request 使用指南

### 基本用法

```typescript
import { feishuRequest } from '@extension/shared';

// GET 请求
const response = await feishuRequest.get('/wiki/v2/spaces');
console.log(response.data);

// POST 请求
const createResponse = await feishuRequest.post('/doc/v2/create', {
  title: '新文档',
  content: '<p>文档内容</p>'
});

// PUT 请求
const updateResponse = await feishuRequest.put('/doc/v2/update', {
  title: '更新的文档标题'
});
```

### 特性

1. **自动令牌管理**
   - 自动获取和刷新 `tenant_access_token`
   - 令牌过期前30分钟自动刷新
   - 支持令牌持久化存储

2. **错误处理**
   - 自动处理令牌过期（code: 99991663）
   - 统一的错误响应格式
   - 请求重试机制

3. **类型安全**
   - 完整的TypeScript类型定义
   - 泛型支持，可指定响应数据类型

### API 方法

#### HTTP 请求方法

```typescript
// GET 请求
feishuRequest.get<T>(url: string, config?: AxiosRequestConfig)

// POST 请求
feishuRequest.post<T>(url: string, data?: any, config?: AxiosRequestConfig)

// PUT 请求
feishuRequest.put<T>(url: string, data?: any, config?: AxiosRequestConfig)

// PATCH 请求
feishuRequest.patch<T>(url: string, data?: any, config?: AxiosRequestConfig)

// DELETE 请求
feishuRequest.delete<T>(url: string, config?: AxiosRequestConfig)
```

#### 令牌管理方法

```typescript
// 获取当前的 tenant_access_token
const tenantToken = feishuRequest.getTenantAccessToken();

// 手动刷新令牌
await feishuRequest.refreshTokens();

// 清除所有令牌
await feishuRequest.clearTokens();
```

### 配置要求

使用前需要在飞书开放平台配置中设置：

1. `app_id` - 应用唯一标识
2. `app_secret` - 应用密钥

这些配置通过 `FEISHU_CONFIG` 获取，需要在扩展的设置页面中配置。

### 响应格式

所有请求的响应都遵循飞书API的标准格式：

```typescript
interface FeishuApiResponse<T = any> {
  code: number;        // 错误码，0表示成功
  msg: string;         // 错误描述
  data?: T;           // 响应数据
  tenant_access_token?: string; // 租户访问令牌
  expire?: number;     // 令牌过期时间（秒）
}
```

### 使用示例

#### 获取知识库列表

```typescript
import { feishuRequest } from '@extension/shared';

interface WikiSpace {
  space_id: string;
  name: string;
  description?: string;
}

interface WikiListResponse {
  items: WikiSpace[];
  page_token?: string;
  has_more: boolean;
}

try {
  const response = await feishuRequest.get<WikiListResponse>('/wiki/v2/spaces');
  const wikis = response.data.data?.items || [];
  console.log('知识库列表:', wikis);
} catch (error) {
  console.error('获取知识库失败:', error);
}
```

#### 创建文档

```typescript
import { feishuRequest } from '@extension/shared';

interface CreateDocResponse {
  document: {
    document_id: string;
    revision_id: number;
    title: string;
  };
}

try {
  const response = await feishuRequest.post<CreateDocResponse>('/docx/v1/documents', {
    title: '我的新文档',
    folder_token: 'folder_id_here'
  });
  
  const document = response.data.data?.document;
  console.log('文档创建成功:', document);
} catch (error) {
  console.error('创建文档失败:', error);
}
```

### 注意事项

1. **令牌类型**
   - 本封装使用 `tenant_access_token` 进行API调用
   - `tenant_access_token` 是租户级别的访问令牌，用于访问租户相关的API
   - 令牌有效期为2小时，剩余有效期小于30分钟时会自动刷新

2. **权限要求**
   - 确保应用在飞书开放平台中配置了相应的API权限
   - 不同的API可能需要不同的权限范围

3. **错误处理**
   - 建议在使用时添加适当的错误处理逻辑
   - 网络错误、权限错误等都会抛出异常

4. **性能考虑**
   - 令牌会自动缓存和刷新，避免频繁的令牌获取请求
   - 支持请求拦截器，可以添加自定义的请求/响应处理逻辑