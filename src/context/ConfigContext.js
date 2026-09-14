import React, { createContext, useContext, useEffect, useState } from 'react';
import { configService } from '../services/services';

const ConfigContext = createContext();

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [levelList, setLevelList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch config from the backend (reads from Realtime Database "/config")
    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await configService.getConfig();
            setConfig(data);

            // Extract levelList and sort by sortOrder
            if (data?.levelList && Array.isArray(data.levelList)) {
                const sorted = [...data.levelList].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setLevelList(sorted);
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching config:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Helper: get just the Arabic level names as a flat array (for dropdowns, filters, etc.)
    const getLevelNames = () => {
        return levelList.map(level => level.arName);
    };

    // Helper: get a map of level id → arName (replaces the old hardcoded AGE_LEVEL_MAP)
    const getLevelMap = () => {
        const map = {};
        levelList.forEach(level => {
            map[level.id] = level.arName;
        });
        return map;
    };

    const value = {
        config,
        levelList,
        getLevelNames,
        getLevelMap,
        configLoading: loading,
        configError: error,
        refreshConfig: fetchConfig
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
