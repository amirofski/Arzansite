import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Console log with ASCII art and hiring message
console.log(`
⠀⠀⠀⠀    ⠀⢀⣤⣄
⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⡆ ⣠⣶⣿⣶⡀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏
⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⠋
⠀⠀⠀⠀⣾⣿⣿⣧⠀⠻⣿⣿⠿⠉
⣰⣿⣿⣿⣿⣿⣿⣿
⠸⣿⣿⣿⣿⣿⣿⠏
⠀⠈⠛⠿⣿⣿⡟

╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║  🚀 WE'RE HIRING! Join Our Amazing Team! 🚀                                     ║
║                                                                                  ║
║  💼 React Developers        💼 UI/UX Designers                                  ║
║  💼 Full-Stack Engineers    💼 Mobile App Developers                           ║
║                                                                                  ║
║  🌐 arzansite.com/careers  📧 careers@arzansite.com                            ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
    `);

createRoot(document.getElementById("root")!).render(<App />);
