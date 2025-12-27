import React from 'react';
import { Button } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="link"
            onClick={toggleTheme}
            className="nav-link px-3 text-reset"
            aria-label="Toggle theme"
            style={{ textDecoration: 'none' }}
        >
            {theme === 'dark' ? (
                <i className="bi bi-sun-fill fs-5 text-warning"></i>
            ) : (
                <i className="bi bi-moon-stars-fill fs-5 text-primary"></i>
            )}
        </Button>
    );
};

export default ThemeToggle;
