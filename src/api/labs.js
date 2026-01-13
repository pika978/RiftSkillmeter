import api from './api';

export const fetchLabs = async () => {
    try {
        const response = await api.get('/labs/');
        return response.data;
    } catch (error) {
        console.error('Error fetching labs:', error);
        throw error;
    }
};

export const createLab = async (name, language, files) => {
    try {
        const response = await api.post('/labs/', { name, language, files });
        return response.data;
    } catch (error) {
        console.error('Error creating lab:', error);
        throw error;
    }
};

export const updateLab = async (id, name, language, files) => {
    try {
        const response = await api.put(`/labs/${id}/`, { name, language, files });
        return response.data;
    } catch (error) {
        console.error('Error updating lab:', error);
        throw error;
    }
};

export const deleteLab = async (id) => {
    try {
        await api.delete(`/labs/${id}/`);
        return true;
    } catch (error) {
        console.error('Error deleting lab:', error);
        throw error;
    }
};
