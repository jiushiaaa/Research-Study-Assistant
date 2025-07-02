# LocationImageDisplay 组件

一个专为景点图片展示设计的React组件，支持多种展示模式和交互功能。

## 功能特点

- 🖼️ **多格式支持**: 支持字符串、JSON字符串、数组等多种图片URL格式
- 🎠 **轮播展示**: 多张图片时支持轮播切换
- 🔍 **图片预览**: 点击放大查看，支持键盘导航
- 📱 **响应式设计**: 适配不同屏幕尺寸
- ⚡ **性能优化**: 智能加载状态管理
- 🎨 **美观样式**: 现代化UI设计，支持暗黑模式
- 📊 **数量标识**: 自动显示图片数量徽章
- 🔄 **加载状态**: 优雅的加载和错误处理

## 基本用法

```tsx
import LocationImageDisplay from '../components/LocationImageDisplay';

// 基本使用
<LocationImageDisplay
  imageUrls={['url1.jpg', 'url2.jpg']}
  locationName="景点名称"
/>

// 完整配置
<LocationImageDisplay
  imageUrls={location.imageUrls}
  locationName={location.nameZh}
  height={200}
  width="100%"
  showPreview={true}
  showCarousel={true}
  showBadge={true}
  autoPlay={false}
  className="custom-class"
/>
```

## API 参数

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `imageUrls` | `string[] \| string` | - | 图片URL列表，支持数组或JSON字符串 |
| `locationName` | `string` | - | 景点名称，用于alt属性 |
| `className` | `string` | `''` | 自定义CSS类名 |
| `height` | `number \| string` | `200` | 容器高度 |
| `width` | `number \| string` | `'100%'` | 容器宽度 |
| `showPreview` | `boolean` | `true` | 是否启用图片预览功能 |
| `showCarousel` | `boolean` | `true` | 多图时是否显示轮播 |
| `showBadge` | `boolean` | `true` | 是否显示图片数量徽章 |
| `autoPlay` | `boolean` | `false` | 轮播是否自动播放 |
| `placeholder` | `React.ReactNode` | - | 无图片时的占位符 |

## 使用场景

### 1. 景点卡片中的封面图片
```tsx
<LocationImageDisplay
  imageUrls={location.imageUrls}
  locationName={location.nameZh}
  height={160}
  showPreview={false}  // 卡片中不启用预览
  className="landmark-image"
/>
```

### 2. Modal中的详细图片展示
```tsx
<LocationImageDisplay
  imageUrls={landmarkImages}
  locationName={selectedLandmark.title}
  height={300}
  showPreview={true}   // 启用预览功能
  autoPlay={true}      // 自动轮播
  className="modal-image-display"
/>
```

### 3. 自定义占位符
```tsx
<LocationImageDisplay
  imageUrls={[]}
  locationName="景点名称"
  placeholder={
    <div>
      <Icon type="camera" />
      <p>暂无图片</p>
    </div>
  }
/>
```

## 样式定制

组件提供了丰富的CSS类名用于样式定制：

```css
/* 基础容器 */
.location-image-display { }

/* 单张图片模式 */
.location-image-display.single-image { }

/* 轮播模式 */
.location-image-display.carousel { }

/* 无图片状态 */
.location-image-display.no-images { }

/* 加载状态 */
.image-loading-overlay { }

/* 错误状态 */
.image-error-placeholder { }
```

## 数据格式支持

组件会自动解析以下格式的图片数据：

```js
// 字符串数组
['url1.jpg', 'url2.jpg']

// JSON字符串
'["url1.jpg", "url2.jpg"]'

// 单个URL字符串
'url1.jpg'

// 空数据
null, undefined, [], ""
```

## 响应式支持

- **桌面端**: 完整功能，包含hover效果
- **平板端**: 优化触摸交互
- **移动端**: 简化动画，优化性能

## 无障碍支持

- 语义化HTML结构
- 完善的alt属性
- 键盘导航支持
- 屏幕阅读器友好

## 注意事项

1. **图片格式**: 建议使用常见的图片格式（jpg, png, webp等）
2. **尺寸优化**: 建议提供适当尺寸的图片以优化加载速度
3. **错误处理**: 组件会自动处理图片加载失败的情况
4. **内存管理**: 组件会在卸载时清理相关状态

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础图片展示功能
- 轮播和预览功能
- 响应式设计 