import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Console log with ASCII art and hiring message
console.log(`⠀⣠⠴⠚⡙⠙⠲⣤⣠⠖⢋⡛⠙⠲⣄⠀⠀⣴⠃⣰⠟⠉⠙⢦⡈⢁⣾⡟⠉⠳⣆⠸⣇⠀⣿⠀⣿⠀⠀⠀⠀⠛⠛⠁⠀⠀⠀⡿⠄⣿⠄⠸⡄⠸⣇⠀⠀⠀⠀⠀⠀⠀⠀⣰⠃⣰⡏⠀⠀⠙⣆⠙⢧⡀⠀⠀⠀⠀⢀⡴⠃⣰⠏⠀⠀⠀⠀⠈⠳⣄⠙⠶⣄⣀⠴⠋⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠈⠓⢦⡈⢡⣰⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠋⠁⠀⠀⠀⠀⠀⠀⠀We're hiring! arzansite.com/careers`);

createRoot(document.getElementById("root")!).render(<App />);
