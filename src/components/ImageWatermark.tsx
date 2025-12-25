import React, { useState, useRef } from 'react';
import { Button, Card, ColorPicker, Flex, Form, Input, InputNumber, Slider, Typography, Watermark, Upload, message, Tooltip, Divider } from 'antd';
import { DownloadOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColorPickerProps, GetProp, WatermarkProps } from 'antd';
import html2canvas from 'html2canvas';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

type Color = Extract<GetProp<ColorPickerProps, 'value'>, string | { cleared: any }>;

interface WatermarkConfig {
  content: string;
  color: string | Color;
  fontSize: number;
  zIndex: number;
  rotate: number;
  gap: [number, number];
  offset?: [number, number];
}

const ImageWatermark: React.FC = () => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [config, setConfig] = useState<WatermarkConfig>({
    content: 'Watermark',
    color: 'rgba(0, 0, 0, 0.15)',
    fontSize: 24,
    zIndex: 9,
    rotate: -30,
    gap: [100, 100],
    offset: undefined,
  });
  const watermarkRef = useRef<HTMLDivElement>(null);

  const { content, color, fontSize, zIndex, rotate, gap, offset } = config;

  const watermarkProps: WatermarkProps = {
    content,
    zIndex,
    rotate,
    gap,
    offset,
    font: {
      color: typeof color === 'string' ? color : color.toRgbString(),
      fontSize,
      fontWeight: 'normal', // Ant Design Watermark defaults to normal
    },
  };

  const handleImageUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('请上传图片文件!');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  const resetImage = () => {
    setImageUrl('');
  };

  const downloadWatermarkedImage = async () => {
    if (!watermarkRef.current || !imageUrl) return;

    message.loading({ content: '正在生成图片...', key: 'download' });

    try {
      // 使用html2canvas捕获包含水印的DOM元素
      const canvas = await html2canvas(watermarkRef.current, {
        backgroundColor: null, // 保持透明背景
        scale: 2, // 提高分辨率
        useCORS: true,
        allowTaint: true,
        width: watermarkRef.current.offsetWidth,
        height: watermarkRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: watermarkRef.current.offsetWidth,
        windowHeight: watermarkRef.current.offsetHeight,
      });

      // 将canvas转换为blob并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `watermark-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          message.success({ content: '下载成功!', key: 'download' });
        } else {
          message.error({ content: '生成图片失败', key: 'download' });
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error(error);
      message.error({ content: '发生错误', key: 'download' });
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px' }}>
      <Flex vertical gap="large">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Title level={1} style={{ margin: 0, background: 'linear-gradient(to right, #1890ff, #722ed1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block'}}>
            Watermark Pro
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '1.2em', marginTop: '10px' }}>
            为您的图片添加专业水印，安全、快捷、本地处理。
          </Paragraph>
        </div>

        <Flex gap="large" wrap="wrap" align="start">
          {/* Left Panel: Preview / Upload */}
          <Card 
            hoverable
            style={{ 
              flex: '1 1 600px', 
              minHeight: '500px', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            <div style={{ 
                flex: 1, 
                backgroundColor: '#f0f2f5', 
                backgroundImage: 'radial-gradient(#d9d9d9 1px, transparent 0)',
                backgroundSize: '20px 20px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                padding: '24px',
                minHeight: '400px'
            }}>
              {!imageUrl ? (
                <div style={{ width: '100%', padding: '40px' }}>
                   <Dragger 
                    accept="image/*"
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    style={{ background: 'white', borderRadius: '12px', border: '2px dashed #d9d9d9' }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">点击或拖拽图片到此处上传</p>
                    <p className="ant-upload-hint">支持单次上传，图片仅在本地处理，不会上传到服务器</p>
                  </Dragger>
                </div>
              ) : (
                <div ref={watermarkRef} style={{ position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%' }}>
                  <Watermark {...watermarkProps}>
                    <img
                      src={imageUrl}
                      alt="preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        display: 'block',
                        objectFit: 'contain'
                      }}
                    />
                  </Watermark>
                </div>
              )}
            </div>
            
            {imageUrl && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', background: 'white', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                   <Tooltip title="清除图片">
                      <Button icon={<DeleteOutlined />} onClick={resetImage} danger>清除</Button>
                   </Tooltip>
                   <Button 
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={downloadWatermarkedImage} 
                    size="large"
                    style={{ borderRadius: '8px', padding: '0 32px' }}
                   >
                     下载图片
                   </Button>
              </div>
            )}
          </Card>

          {/* Right Panel: Configuration */}
          <Card 
             title="水印设置" 
             style={{ 
               flex: '0 0 360px', 
               boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
               borderRadius: '16px',
               position: 'sticky',
               top: '20px'
             }}
             headStyle={{ borderBottom: '1px solid #f0f0f0', fontSize: '1.1em' }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={config}
              onValuesChange={() => {
                // If we are changing nested values like interval, update config accordingly
                // Note: onValuesChange gives us partial updates. We might need to merge.
                // However, Ant Form strictly controlled mode isn't being used here fully (we use state).
                // Let's just update the specific state with the changed values.
                // But `values` in onValuesChange contains ONLY the changed field.
                // We should use form.getFieldsValue() to get the full state.
                setConfig(form.getFieldsValue());
              }}
            >
              <Form.Item name="content" label="水印文字">
                <Input placeholder="Designed by Antigravity" maxLength={50} showCount allowClear />
              </Form.Item>

              <Divider dashed style={{ margin: '16px 0' }}/>
              
              <Flex gap="small">
                <Form.Item name="color" label="颜色" style={{ flex: 1 }}>
                   <ColorPicker showText />
                </Form.Item>
                 <Form.Item name="fontSize" label="大小" style={{ flex: 1 }}>
                   <InputNumber min={12} max={200} style={{ width: '100%' }} />
                </Form.Item>
              </Flex>

              <Form.Item name="fontSize" label={null} style={{ marginTop: '-12px' }}>
                <Slider min={12} max={200} tooltip={{ open: false }} />
              </Form.Item>

              <Divider dashed style={{ margin: '16px 0' }}/>

              <Form.Item name="rotate" label="旋转角度">
                 <Slider min={-180} max={180} marks={{ 0: '0°', 45: '45°', '-45': '-45°' }} step={5} />
              </Form.Item>

              <Divider dashed style={{ margin: '16px 0' }}/>

              <Form.Item label="间距 (X / Y)">
                <Flex gap="small">
                  <Form.Item name={['gap', 0]} noStyle>
                    <InputNumber prefix="X" style={{ width: '100%' }} min={0} />
                  </Form.Item>
                  <Form.Item name={['gap', 1]} noStyle>
                    <InputNumber prefix="Y" style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Flex>
              </Form.Item>
              
               <Form.Item label="偏移 (X / Y)">
                <Flex gap="small">
                  <Form.Item name={['offset', 0]} noStyle>
                    <InputNumber prefix="X" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['offset', 1]} noStyle>
                    <InputNumber prefix="Y" style={{ width: '100%' }} />
                  </Form.Item>
                </Flex>
              </Form.Item>
            </Form>
          </Card>
        </Flex>
      </Flex>
    </div>
  );
};

export default ImageWatermark;