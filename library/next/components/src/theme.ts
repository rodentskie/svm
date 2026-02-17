import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        green: {
          50: { value: "#f0fdf4" },
          100: { value: "#dcfce7" },
          200: { value: "#bbf7d0" },
          300: { value: "#86efac" },
          400: { value: "#4ade80" },
          500: { value: "#22c55e" },
          600: { value: "#16a34a" },
          700: { value: "#15803d" },
          800: { value: "#166534" },
          900: { value: "#145231" },
          950: { value: "#092e20" },
        },
      },
    },
    semanticTokens: {
      colors: {
        colorPalette: { value: "{colors.green}" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
