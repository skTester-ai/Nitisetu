import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// Apply theme synchronously at module load time — prevents flash of unstyled content
const getInitialTheme = () => {
  const stored = localStorage.getItem("niti-setu-theme");
  return stored || "dark";
};

// Set it immediately on the HTML element before any React renders
const initialTheme = getInitialTheme();
document.documentElement.setAttribute("data-theme", initialTheme);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("niti-setu-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
