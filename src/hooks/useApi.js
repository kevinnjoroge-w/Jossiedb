import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(endpoint, options);
            setData(response.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const refetch = () => {
        fetchData();
    };

    return { data, loading, error, refetch };
};
