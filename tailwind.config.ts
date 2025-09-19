// tailwind.config.ts
import type { Config } from 'tailwindcss'


export default <Partial<Config>>{
content: [
'./components/**/*.{vue,js,ts}',
'./layouts/**/*.vue',
'./pages/**/*.vue',
'./composables/**/*.{js,ts}',
'./plugins/**/*.{js,ts}',
'./app.vue'
],
theme: {
extend: {
colors: {
adnu: {
blue: '#003A6C',
gold: '#FDB515',
ink: '#0F172A'
}
},
boxShadow: {
glass: '0 8px 32px rgba(0,0,0,0.08)'
},
borderRadius: {
'2xl': '1rem',
'3xl': '1.25rem'
}
}
},
plugins: []
}