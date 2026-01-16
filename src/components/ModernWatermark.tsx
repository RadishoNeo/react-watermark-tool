import React, { useState, useRef } from 'react';
import {
    Button,
    ColorPicker,
    Flex,
    Form,
    Input,
    InputNumber,
    Slider,
    Watermark,
    Upload,
    message,
    Divider,
    ConfigProvider,
    theme
} from 'antd';
import {
    Download,
    Upload as UploadIcon,
    Trash2,
    Settings2,
    Image as ImageIcon,
    ChevronRight,
    Sparkles,
    Github,
    Heart
} from 'lucide-react';
import type { ColorPickerProps, GetProp, WatermarkProps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const { Dragger } = Upload;

type Color = Extract<GetProp<ColorPickerProps, 'value'>, string | { cleared: boolean }>;

interface WatermarkConfig {
    content: string;
    color: string | Color;
    fontSize: number;
    zIndex: number;
    rotate: number;
    gap: [number, number];
    offset?: [number, number];
}

const ModernWatermark: React.FC = () => {
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [config, setConfig] = useState<WatermarkConfig>({
        content: 'Watermark Pro',
        color: 'rgba(255, 255, 255, 0.2)',
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
            fontWeight: 'normal',
        },
    };

    const handleImageUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Please upload an image file!');
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        return false;
    };

    const resetImage = () => {
        setImageUrl('');
    };

    const downloadWatermarkedImage = async () => {
        if (!imageUrl) return;

        setIsExporting(true);
        const hide = message.loading('Generating high-quality export...', 0);

        try {
            // 1. Create a temporary image to get original dimensions
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            // 2. Setup Canvas with original image dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            canvas.width = img.width;
            canvas.height = img.height;

            // 3. Draw original image
            ctx.drawImage(img, 0, 0);

            // 4. Draw Watermark (Tiled)
            const textColor = typeof color === 'string' ? color : color.toRgbString();
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';

            const angle = (rotate * Math.PI) / 180;
            const [gapX, gapY] = gap;
            const [offsetX, offsetY] = offset || [gapX / 2, gapY / 2];

            // Calculate tiling grid
            // Increase range to cover the whole rotated canvas
            const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
            const cols = Math.ceil(diagonal / gapX) + 4;
            const rows = Math.ceil(diagonal / gapY) + 4;

            ctx.save();
            // Rotate around the center if needed, but for tiled watermark we usually 
            // just translate and rotate the individual text or the whole context.
            // Ant Design tiles relative to the container.

            for (let r = -rows; r < rows; r++) {
                for (let c = -cols; c < cols; c++) {
                    ctx.save();
                    const x = c * gapX + offsetX;
                    const y = r * gapY + offsetY;

                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.fillText(content, 0, 0);
                    ctx.restore();
                }
            }
            ctx.restore();

            // 5. Export
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });

            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `watermark-pro-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                message.success('Masterpiece saved successfully!');
            } else {
                throw new Error('Blob generation failed');
            }
        } catch (error) {
            console.error('Export Error:', error);
            message.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
            hide();
        }
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#6366f1',
                    borderRadius: 12,
                    colorBgContainer: 'rgba(17, 24, 39, 0.5)',
                },
            }}
        >
            <div className="min-h-screen w-full mesh-gradient py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
                <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="flex justify-center mb-6">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="w-20 h-20 rounded-2xl glass p-4 flex items-center justify-center border-white/10"
                            >
                                <img src={`${import.meta.env.VITE_BASE_URI}/logo.svg`} alt="Watermark Pro Logo" className="w-full h-full" />
                            </motion.div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-xs font-medium text-indigo-300 mb-6">
                            <Sparkles size={14} className="text-indigo-400" />
                            <span>Experience the Future of Watermarking</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
                            <span className="text-white">Watermark</span>
                            <span className="text-gradient"> Pro</span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
                            Secure your creative work with professional-grade watermarks.
                            Processed locally in your browser for ultimate privacy.
                        </p>
                    </motion.header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Panel: Preview Area */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-8 space-y-6"
                        >
                            <div className={cn(
                                "glass-card rounded-3xl overflow-hidden transition-all duration-500",
                                !imageUrl ? "aspect-[16/9]" : "min-h-[500px]"
                            )}>
                                <div className="p-1 h-full flex flex-col">
                                    <div className="flex-1 relative flex items-center justify-center bg-zinc-950/50 rounded-[calc(1.5rem-4px)] overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            {!imageUrl ? (
                                                <motion.div
                                                    key="upload"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="w-full h-full p-8"
                                                >
                                                    <Dragger
                                                        accept="image/*"
                                                        beforeUpload={handleImageUpload}
                                                        showUploadList={false}
                                                        className="h-full border-none bg-transparent group"
                                                    >
                                                        <div className="flex flex-col items-center justify-center p-12 space-y-6">
                                                            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors duration-300">
                                                                <UploadIcon className="text-indigo-400 w-10 h-10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-2xl font-semibold text-white">Click or drag image to upload</p>
                                                                <p className="text-zinc-500">Everything stays in your browser. Privacy first.</p>
                                                            </div>
                                                            <Button size="large" className="rounded-full bg-white text-black hover:bg-zinc-200 border-none px-8 h-12 flex items-center gap-2">
                                                                Select Image <ChevronRight size={16} />
                                                            </Button>
                                                        </div>
                                                    </Dragger>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="preview"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-8 w-full flex flex-col items-center"
                                                >
                                                    <div
                                                        ref={watermarkRef}
                                                        className="relative shadow-2xl rounded-xl overflow-hidden max-w-full ring-1 ring-white/20"
                                                    >
                                                        <Watermark {...watermarkProps}>
                                                            <img
                                                                src={imageUrl}
                                                                alt="preview"
                                                                className="max-w-full max-h-[65vh] block object-contain"
                                                            />
                                                        </Watermark>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {imageUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 flex items-center justify-between bg-zinc-900/40"
                                        >
                                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                <ImageIcon size={16} />
                                                <span>Ready for export</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    icon={<Trash2 size={16} />}
                                                    onClick={resetImage}
                                                    className="border-white/10 hover:border-red-500/50 hover:text-red-400 bg-white/5"
                                                >
                                                    Clear
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    icon={<Download size={16} />}
                                                    onClick={downloadWatermarkedImage}
                                                    loading={isExporting}
                                                    className="bg-indigo-500 hover:bg-indigo-600 border-none h-10 px-6"
                                                >
                                                    Download Result
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Tips Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { title: "Local Processing", desc: "Your images never leave your device." },
                                    { title: "High Resolution", desc: "Retains the original quality of your photos." },
                                    { title: "Instant Export", desc: "Ready to use in seconds with one click." }
                                ].map((tip, i) => (
                                    <div key={i} className="p-4 rounded-2xl glass border-white/5 text-sm">
                                        <h3 className="text-white font-medium mb-1">{tip.title}</h3>
                                        <p className="text-zinc-500">{tip.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right Panel: Controls */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-4"
                        >
                            <div className="glass-card rounded-3xl p-6 sticky top-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Settings2 className="text-indigo-400 w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Customization</h2>
                                        <p className="text-zinc-500 text-xs">Configure your watermark appearance</p>
                                    </div>
                                </div>

                                <Form
                                    form={form}
                                    layout="vertical"
                                    initialValues={config}
                                    onValuesChange={() => setConfig(form.getFieldsValue())}
                                    requiredMark={false}
                                >
                                    <Form.Item name="content" label={<span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Watermark Text</span>}>
                                        <Input
                                            placeholder="Designed by Antigravity"
                                            className="bg-white/5 border-white/10 hover:border-indigo-500/50 focus:border-indigo-500 h-11 text-white"
                                        />
                                    </Form.Item>

                                    <Divider className="border-white/5 my-6" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Form.Item name="color" label={<span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Color</span>}>
                                            <ColorPicker showText className="w-full bg-white/5 border-white/10" />
                                        </Form.Item>
                                        <Form.Item name="fontSize" label={<span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Size</span>}>
                                            <InputNumber min={12} max={200} className="w-full bg-white/5 border-white/10" />
                                        </Form.Item>
                                    </div>

                                    <Form.Item name="fontSize" label={null}>
                                        <Slider min={12} max={200} tooltip={{ open: false }} className="modern-slider" />
                                    </Form.Item>

                                    <Divider className="border-white/5 my-6" />

                                    <Form.Item name="rotate" label={<span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Rotation Angle</span>}>
                                        <Slider min={-180} max={180} step={5} className="modern-slider" />
                                    </Form.Item>

                                    <Divider className="border-white/5 my-6" />

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider block mb-3">Spacing (X / Y)</label>
                                            <Flex gap="small">
                                                <Form.Item name={['gap', 0]} noStyle>
                                                    <InputNumber prefix={<span className="text-zinc-600 text-[10px]">X</span>} className="w-full bg-white/5 border-white/10" min={0} />
                                                </Form.Item>
                                                <Form.Item name={['gap', 1]} noStyle>
                                                    <InputNumber prefix={<span className="text-zinc-600 text-[10px]">Y</span>} className="w-full bg-white/5 border-white/10" min={0} />
                                                </Form.Item>
                                            </Flex>
                                        </div>

                                        <div>
                                            <label className="text-zinc-400 text-xs font-medium uppercase tracking-wider block mb-3">Offset (X / Y)</label>
                                            <Flex gap="small">
                                                <Form.Item name={['offset', 0]} noStyle>
                                                    <InputNumber prefix={<span className="text-zinc-600 text-[10px]">X</span>} className="w-full bg-white/5 border-white/10" />
                                                </Form.Item>
                                                <Form.Item name={['offset', 1]} noStyle>
                                                    <InputNumber prefix={<span className="text-zinc-600 text-[10px]">Y</span>} className="w-full bg-white/5 border-white/10" />
                                                </Form.Item>
                                            </Flex>
                                        </div>
                                    </div>
                                </Form>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Global CSS for Slider to make it look even better */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          .modern-slider .ant-slider-rail { background-color: rgba(255,255,255,0.05) !important; }
          .modern-slider .ant-slider-track { background-color: #6366f1 !important; }
          .modern-slider .ant-slider-handle::after { background-color: #030712 !important; box-shadow: 0 0 0 2px #6366f1 !important; }
          .ant-input-number, .ant-input, .ant-picker { color: white !important; }
          .ant-form-item-label label { height: auto !important; }
        ` }} />
            </div>

            {/* Footer */}
            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-24 pb-8 text-center"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="h-px w-24 bg-linear-to-r from-transparent via-zinc-700 to-transparent mb-4" />
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <span>Created with</span>
                        <Heart size={14} className="text-rose-500 fill-rose-500" />
                        <span>by</span>
                        <a
                            href="https://github.com/RadishoNeo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            RadishoNeo
                        </a>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/RadishoNeo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs"
                        >
                            <Github size={14} />
                            GitHub Profile
                        </a>
                        <span className="text-zinc-800">|</span>
                        <span className="text-zinc-600 text-xs">© 2026 Watermark Pro. All rights reserved.</span>
                    </div>
                </div>
            </motion.footer>
        </ConfigProvider>
    );
};

export default ModernWatermark;
