import { formatTicketForSubmit } from './utils';

export const handleSubmit = (e, editedTicket, handleSave) => {
    e.preventDefault();
    const formattedTicket = formatTicketForSubmit(editedTicket);
    handleSave(formattedTicket);
}; 