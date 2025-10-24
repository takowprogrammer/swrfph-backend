import { defineConfig } from 'prisma/scripts'

export default defineConfig({
  seed: 'ts-node prisma/seed.ts',
})
