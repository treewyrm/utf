import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/alchemy/index.ts',
    './src/math/index.ts',
    './src/model/index.ts',
    './src/surface/index.ts',
    './src/utility/index.ts',
  ],
  platform: 'neutral',
})
