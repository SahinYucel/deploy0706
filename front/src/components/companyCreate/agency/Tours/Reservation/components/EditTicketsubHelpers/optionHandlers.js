import { addTicketOption, deleteTicketOption } from '../../../../../../../services/api';

export const handleAddOption = async (ticketId, newOption, options, setOptions, setNewOption) => {
    try {
        const response = await addTicketOption(ticketId, newOption);
        
        if (response.optionId) {
            setOptions([...options, { ...newOption, id: response.optionId }]);
            setNewOption({
                option_name: '',
                price: ''
            });
        }
    } catch (error) {
        console.error('Opsiyon eklenirken hata:', error);
    }
};

export const handleDeleteOption = async (ticketId, optionId, options, setOptions) => {
    try {
        await deleteTicketOption(ticketId, optionId);
        setOptions(options.filter(opt => opt.id !== optionId));
    } catch (error) {
        console.error('Opsiyon silinirken hata:', error);
    }
}; 