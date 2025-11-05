import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.js",
            name: "C3",
            fileName: (format) => `c3-sdk.${format}.js`,
            formats: ["umd", "es"],
        },
        rollupOptions: {
            output: {
                // 确保全局变量名称
                globals: {},
                // 压缩和混淆
                compact: true,
                // 最小化输出
                minifyInternalExports: true,
            },
        },
        // 使用 terser 进行更彻底的压缩和混淆
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true, // 移除所有 console
                drop_debugger: true,
                pure_funcs: ["console.log", "console.warn", "console.error"], // 移除所有 console 函数
                passes: 3, // 多次压缩以获得更好的效果
                dead_code: true, // 移除死代码
                unused: true, // 移除未使用的代码
            },
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_/, // 混淆以下划线开头的属性
                },
                reserved: ["C3", "c3", "init", "AdSense", "GPT", "AFS"], // 保留必要的 API 名称
            },
            format: {
                comments: false, // 移除注释
            },
        },
        target: "es2015",
        sourcemap: false,
        // 提高压缩率
        chunkSizeWarningLimit: 1000,
    },
});
