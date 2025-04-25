import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // TODO: change to the port you want
    host: true,  // Optional: allow access from localhost
    allowedHosts: [
      'ec2-16-162-34-49.ap-east-1.compute.amazonaws.com',
      'jysalb-1772187126.ap-east-1.elb.amazonaws.com',
      'hk-immigration.jiangyan.click',
    ]
  }
});
